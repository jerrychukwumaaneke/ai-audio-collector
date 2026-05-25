import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { languages, reviews, submissions, tasks, users } from "../db/schema";
import { SUBMISSION_STATUSES, SubmissionStatus } from "../db/schema/submissions";

export async function createSubmission({
  taskId,
  userId,
  audioLanguageCode,
  audioUrl,
}: {
  taskId: string;
  userId: string;
  audioLanguageCode: string;
  audioUrl: string;
}) {
  const existing = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.taskId, taskId),
        eq(submissions.audioLanguageCode, audioLanguageCode),
        eq(submissions.userId, userId)
      )
    );

  if (existing.length > 0) {
    throw Object.assign(
      new Error("You have already recorded this task in this language"),
      { statusCode: 409 }
    );
  }

  const [submission] = await db
    .insert(submissions)
    .values({
      taskId,
      userId,
      audioLanguageCode,
      audioUrl,
      status: "PENDING",
    })
    .returning();

  return submission;
}

export async function getAllSubmissions(filters?: {
  status?: SubmissionStatus;
  languageCode?: string;
  userId?: string;
}) {
  let query = db
    .select({
      id: submissions.id,
      audioUrl: submissions.audioUrl,
      status: submissions.status,
      failureReason: submissions.failureReason,
      createdAt: submissions.createdAt,
      updatedAt: submissions.updatedAt,

      taskId: tasks.id,
      taskPrompt: tasks.prompt,

      userId: users.id,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userEmail: users.email,

      languageName: languages.name,
      audioLanguageCode: languages.code,
    })
    .from(submissions)
    .leftJoin(tasks, eq(tasks.id, submissions.taskId))
    .leftJoin(users, eq(users.id, submissions.userId))
    .leftJoin(languages, eq(languages.code, submissions.audioLanguageCode))
    .$dynamic();

  const conditions = [];

  if (filters?.status) {
    conditions.push(eq(submissions.status, filters.status));
  }

  if (filters?.languageCode) {
    conditions.push(eq(submissions.audioLanguageCode, filters.languageCode));
  }

  if (filters?.userId) {
    conditions.push(eq(submissions.userId, filters.userId));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const rows = await query.orderBy(submissions.createdAt);

  return rows.map((row) => ({
    id: row.id,
    audioUrl: row.audioUrl,
    status: row.status,
    failureReason: row.failureReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    task: {
      id: row.taskId,
      prompt: row.taskPrompt,
    },
    user: {
      id: row.userId,
      firstName: row.userFirstName,
      lastName: row.userLastName,
      email: row.userEmail,
    },
    language: {
      name: row.languageName,
      code: row.audioLanguageCode,
    },
  }));
}

export async function findSubmissionById(id: string) {
  const [row] = await db
    .select({
      id: submissions.id,
      audioUrl: submissions.audioUrl,
      status: submissions.status,
      failureReason: submissions.failureReason,
      createdAt: submissions.createdAt,
      updatedAt: submissions.updatedAt,

      taskId: tasks.id,
      taskPrompt: tasks.prompt,

      userId: users.id,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userEmail: users.email,

      languageName: languages.name,
      audioLanguageCode: languages.code,
    })
    .from(submissions)
    .leftJoin(tasks, eq(tasks.id, submissions.taskId))
    .leftJoin(users, eq(users.id, submissions.userId))
    .leftJoin(languages, eq(languages.code, submissions.audioLanguageCode))
    .where(eq(submissions.id, id));

  if (!row) return null;

  const reviewHistory = await db
    .select({
      id: reviews.id,
      decision: reviews.decision,
      feedback: reviews.feedback,
      createdAt: reviews.createdAt,
      reviewerId: users.id,
      reviewerFirstName: users.firstName,
      reviewerLastName: users.lastName,
    })
    .from(reviews)
    .leftJoin(users, eq(users.id, reviews.reviewerId))
    .where(eq(reviews.submissionId, id))
    .orderBy(reviews.createdAt);

  return {
    id: row.id,
    audioUrl: row.audioUrl,
    status: row.status,
    failureReason: row.failureReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    task: {
      id: row.taskId,
      prompt: row.taskPrompt,
    },
    user: {
      id: row.userId,
      firstName: row.userFirstName,
      lastName: row.userLastName,
      email: row.userEmail,
    },
    language: {
      name: row.languageName,
      code: row.audioLanguageCode,
    },
    reviewHistory: reviewHistory.map((r) => ({
      id: r.id,
      decision: r.decision,
      feedback: r.feedback,
      createdAt: r.createdAt,
      reviewer: {
        id: r.reviewerId,
        firstName: r.reviewerFirstName,
        lastName: r.reviewerLastName,
      },
    })),
  };
}
