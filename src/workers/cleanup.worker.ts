import cron from "node-cron";
import { and, eq, lt } from "drizzle-orm";
import { db } from "../db";
import { submissions } from "../db/schema/submissions";
import { tasks } from "../db/schema/tasks";
import { languages } from "../db/schema/languages";
import { CLEANUP_THRESHOLDS_SECONDS } from "../config/submissions";
import { audioProcessingQueue } from "../config/queue";
import { deleteFile } from "../services/storage.service";
import { logger } from "../utils/logger";

type TaskType = keyof typeof CLEANUP_THRESHOLDS_SECONDS;

export function startCleanupWorker(): void {
  // Remove expired AWAITING_UPLOAD submissions every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    try {
      const awaiting = await db
        .select()
        .from(submissions)
        .where(eq(submissions.status, "AWAITING_UPLOAD"));

      let count = 0;
      for (const submission of awaiting) {
        const [task] = await db
          .select()
          .from(tasks)
          .where(eq(tasks.id, submission.taskId));
        if (!task) continue;

        const threshold = CLEANUP_THRESHOLDS_SECONDS[task.type as TaskType];
        const elapsedSeconds =
          (Date.now() - submission.createdAt.getTime()) / 1000;

        if (elapsedSeconds > threshold) {
          if (submission.storagePath) {
            try {
              await deleteFile(submission.storagePath);
            } catch {
              logger.warn(
                `Could not delete storage file for ${submission.id} during cleanup`
              );
            }
          }
          await db.delete(submissions).where(eq(submissions.id, submission.id));
          count++;
        }
      }

      logger.info(
        `Cleanup: removed ${count} expired AWAITING_UPLOAD submissions`
      );
    } catch (err) {
      logger.error(
        `Cleanup (AWAITING_UPLOAD) error: ${(err as Error).message}`
      );
    }
  });

  // Re-queue stuck PROCESSING submissions every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const stuck = await db
        .select()
        .from(submissions)
        .where(
          and(
            eq(submissions.status, "PROCESSING"),
            lt(submissions.updatedAt, thirtyMinutesAgo)
          )
        );

      // Fetch once — all stuck submissions share the same supported language set
      const allLanguages = await db
        .select({ code: languages.code })
        .from(languages);
      const supportedLanguageCodes = allLanguages.map((l) => l.code);

      let count = 0;
      for (const submission of stuck) {
        const [task] = await db
          .select()
          .from(tasks)
          .where(eq(tasks.id, submission.taskId));
        if (!task || !submission.audioUrl) continue;

        await audioProcessingQueue.add("process-audio", {
          submissionId: submission.id,
          audioUrl: submission.audioUrl,
          audioLanguageCode: submission.audioLanguageCode,
          originalPrompt: task.prompt,
          originalPromptLanguageCode: task.languageCode,
          supportedLanguageCodes,
        });

        await db
          .update(submissions)
          .set({ status: "PENDING", updatedAt: new Date() })
          .where(eq(submissions.id, submission.id));

        count++;
      }

      logger.info(`Cleanup: re-queued ${count} stuck PROCESSING submissions`);
    } catch (err) {
      logger.error(`Cleanup (PROCESSING) error: ${(err as Error).message}`);
    }
  });
}
