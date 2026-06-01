import crypto from "node:crypto";
import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { languages, submissions, tasks } from "../db/schema";
import { SubmissionStatus } from "../db/schema/submissions";
import {
  MAX_AWAITING_UPLOADS_PER_USER,
  UPLOAD_WINDOWS_SECONDS,
} from "../config/submissions";
import {
  deleteFile,
  generateUploadUrl,
  getPublicUrl,
  verifyFileExists,
} from "./storage.service";
// audioProcessingQueue will be added to queue.ts in Prompt 7C
import { audioProcessingQueue } from "../config/queue";
import { User } from "../types";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

type Submission = Omit<typeof submissions.$inferSelect, "storagePath">;
type TaskType = "READ_SPEECH" | "SPONTANEOUS_SPEECH";

async function cancelSubmissionById(id: string): Promise<void> {
  try {
    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, id));

    if (!submission) return;

    if (submission.storagePath) {
      try {
        await deleteFile(submission.storagePath);
      } catch (err) {
        logger.error(
          `cancelSubmissionById: storage delete failed for ${submission.storagePath}: ${(err as Error).message}`
        );
      }
    }

    await db.delete(submissions).where(eq(submissions.id, id));
  } catch (err) {
    logger.error(
      `cancelSubmissionById: failed for submission ${id}: ${(err as Error).message}`
    );
  }
}

export async function prepareSubmission(data: {
  taskId: string;
  userId: string;
  audioLanguageCode: string;
  requestingUser: User;
}): Promise<{ submission: Submission; uploadUrl: string; expiresIn: number }> {
  const { taskId, userId, audioLanguageCode } = data;

  // 1. Fetch task
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!task) throw new AppError(404, "Task not found");

  // 2. Validate language code
  const [language] = await db
    .select()
    .from(languages)
    .where(eq(languages.code, audioLanguageCode));
  if (!language) {
    throw new AppError(400, `Language '${audioLanguageCode}' is not supported`);
  }

  // 5. Cap AWAITING_UPLOAD count — silently cancel oldest if at limit
  const [{ awaitingCount }] = await db
    .select({ awaitingCount: count() })
    .from(submissions)
    .where(
      and(
        eq(submissions.userId, userId),
        eq(submissions.status, "AWAITING_UPLOAD")
      )
    );

  if (awaitingCount >= MAX_AWAITING_UPLOADS_PER_USER) {
    const [oldest] = await db
      .select()
      .from(submissions)
      .where(
        and(
          eq(submissions.userId, userId),
          eq(submissions.status, "AWAITING_UPLOAD")
        )
      )
      .orderBy(submissions.createdAt)
      .limit(1);

    if (oldest) await cancelSubmissionById(oldest.id);
  }

  // 6. Cancel existing AWAITING_UPLOAD for same task + language (user is re-recording)
  const [existingForTask] = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.userId, userId),
        eq(submissions.taskId, taskId),
        eq(submissions.audioLanguageCode, audioLanguageCode),
        eq(submissions.status, "AWAITING_UPLOAD")
      )
    );

  if (existingForTask) await cancelSubmissionById(existingForTask.id);

  // 7-8. Build storage path and resolve expiry window
  const storagePath = `submissions/${userId}/${crypto.randomUUID()}.webm`;
  const expiresIn = UPLOAD_WINDOWS_SECONDS[task.type as TaskType];

  // 9. Generate presigned upload URL
  const { signedUrl } = await generateUploadUrl(storagePath);

  // 10. Insert submission row
  const [inserted] = await db
    .insert(submissions)
    .values({
      taskId,
      userId,
      audioLanguageCode,
      storagePath,
      audioUrl: null,
      status: "AWAITING_UPLOAD",
    })
    .returning();

  const { storagePath: _sp, ...submission } = inserted;
  return { submission, uploadUrl: signedUrl, expiresIn };
}

export async function confirmSubmission(
  submissionId: string,
  requestingUser: User
): Promise<Submission> {
  const [submission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.id, submissionId));

  if (!submission) throw new AppError(404, "Submission not found");

  if (submission.userId !== requestingUser.id) {
    throw new AppError(403, "You do not have access to this submission");
  }

  if (submission.status !== "AWAITING_UPLOAD") {
    throw new AppError(
      400,
      `Submission is not awaiting upload. Current status: ${submission.status}`
    );
  }

  // 4. Fetch task for window calculation and queue payload
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, submission.taskId));

  // 5. Check upload window
  const windowSeconds = UPLOAD_WINDOWS_SECONDS[task!.type as TaskType];
  const elapsedSeconds =
    (Date.now() - submission.createdAt.getTime()) / 1000;

  if (elapsedSeconds > windowSeconds) {
    await db
      .update(submissions)
      .set({ status: "FAILED", failureReason: "Upload window expired" })
      .where(eq(submissions.id, submissionId));
    throw new AppError(
      410,
      "Upload window has expired. Please start a new recording."
    );
  }

  // verify file reached storage
  const fileExists = await verifyFileExists(submission.storagePath!);
  if (!fileExists) {
    throw new AppError(
      400,
      "Audio file was not found in storage. Your upload may have failed — please try recording again."
    );
  }

  // resolve public URL
  const publicUrl = getPublicUrl(submission.storagePath!);

  //  transition to PENDING
  const [updated] = await db
    .update(submissions)
    .set({ status: "PENDING", audioUrl: publicUrl })
    .where(eq(submissions.id, submissionId))
    .returning();

  // collect supported language codes for queue payload
  const allLanguages = await db.select({ code: languages.code }).from(languages);
  const supportedLanguageCodes = allLanguages.map((l) => l.code);

  // 10. Enqueue processing job (non-blocking — cleanup worker re-queues on failure)
  try {
    await audioProcessingQueue.add("process-audio", {
      submissionId: submission.id,
      audioUrl: publicUrl,
      audioLanguageCode: submission.audioLanguageCode,
      originalPrompt: task!.prompt,
      originalPromptLanguageCode: task!.languageCode,
      supportedLanguageCodes,
    });
  } catch (err) {
    logger.error(
      `Failed to queue job for submission ${submission.id}: ${(err as Error).message}. Will be picked up by cleanup worker.`
    );
  }

  // 11. Return updated submission without storagePath
  const { storagePath: _sp, ...result } = updated;
  return result;
}

export async function cancelSubmission(
  submissionId: string,
  requestingUser: User
): Promise<void> {
  // 1. Fetch submission
  const [submission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.id, submissionId));

  if (!submission) throw new AppError(404, "Submission not found");

  // 2. Authorization — owner or admin
  if (
    submission.userId !== requestingUser.id &&
    requestingUser.role !== "ADMIN"
  ) {
    throw new AppError(403, "You do not have access to this submission");
  }

  // 3. Only cancellable while in early states
  if (!["AWAITING_UPLOAD", "PENDING"].includes(submission.status)) {
    throw new AppError(
      400,
      `Cannot cancel a submission with status: ${submission.status}`
    );
  }

  // 4. Clean up storage if a file was uploaded
  if (submission.storagePath) {
    try {
      await deleteFile(submission.storagePath);
    } catch (err) {
      logger.error(
        `Storage delete failed for ${submission.storagePath}: ${(err as Error).message}`
      );
    }
  }

  // 5. Remove DB row
  await db.delete(submissions).where(eq(submissions.id, submissionId));
}

export async function getSubmissions(
  requestingUser: User,
  filters: {
    taskId?: string;
    status?: string;
    audioLanguageCode?: string;
  }
): Promise<object[]> {
  const conditions = [];

  if (requestingUser.role === "USER") {
    conditions.push(eq(submissions.userId, requestingUser.id));
  } else if (requestingUser.role === "REVIEWER") {
    conditions.push(
      inArray(submissions.status, ["READY_FOR_REVIEW", "APPROVED", "REJECTED"])
    );
  }

  if (filters.taskId) conditions.push(eq(submissions.taskId, filters.taskId));
  if (filters.status)
    conditions.push(
      eq(submissions.status, filters.status as SubmissionStatus)
    );
  if (filters.audioLanguageCode)
    conditions.push(
      eq(submissions.audioLanguageCode, filters.audioLanguageCode)
    );

  let query = db
    .select({
      id: submissions.id,
      taskId: submissions.taskId,
      userId: submissions.userId,
      audioUrl: submissions.audioUrl,
      audioLanguageCode: submissions.audioLanguageCode,
      status: submissions.status,
      failureReason: submissions.failureReason,
      createdAt: submissions.createdAt,
      updatedAt: submissions.updatedAt,
      taskPrompt: tasks.prompt,
      taskType: tasks.type,
      taskLanguageCode: tasks.languageCode,
    })
    .from(submissions)
    .leftJoin(tasks, eq(tasks.id, submissions.taskId))
    .$dynamic();

  if (conditions.length > 0) query = query.where(and(...conditions));

  const rows = await query.orderBy(submissions.createdAt);

  return rows.map(({ taskPrompt, taskType, taskLanguageCode, ...row }) => ({
    ...row,
    task: { prompt: taskPrompt, type: taskType, languageCode: taskLanguageCode },
  }));
}

export async function getSubmissionById(
  submissionId: string,
  requestingUser: User
): Promise<object> {
  const [row] = await db
    .select({
      id: submissions.id,
      taskId: submissions.taskId,
      userId: submissions.userId,
      audioUrl: submissions.audioUrl,
      audioLanguageCode: submissions.audioLanguageCode,
      status: submissions.status,
      failureReason: submissions.failureReason,
      createdAt: submissions.createdAt,
      updatedAt: submissions.updatedAt,
      taskPrompt: tasks.prompt,
      taskType: tasks.type,
      taskLanguageCode: tasks.languageCode,
    })
    .from(submissions)
    .leftJoin(tasks, eq(tasks.id, submissions.taskId))
    .where(eq(submissions.id, submissionId));

  if (!row) throw new AppError(404, "Submission not found");

  if (requestingUser.role === "USER" && row.userId !== requestingUser.id) {
    throw new AppError(403, "You do not have access to this submission");
  }

  const { taskPrompt, taskType, taskLanguageCode, ...submission } = row;
  return {
    ...submission,
    task: { prompt: taskPrompt, type: taskType, languageCode: taskLanguageCode },
  };
}
