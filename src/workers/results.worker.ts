import { Worker, Job } from "bullmq";
import { eq } from "drizzle-orm";
import { redisConnection } from "../config/redis";
import { AudioResultJob } from "../config/queue";
import { db } from "../db";
import { submissions } from "../db/schema/submissions";
import { logger } from "../utils/logger";

export const resultsWorker = new Worker(
  "audio-results",
  async (job: Job<AudioResultJob>) => {
    const { submissionId, status, errorMessage } = job.data;

    if (status === "success") {
      await db
        .update(submissions)
        .set({ status: "READY_FOR_REVIEW", updatedAt: new Date() })
        .where(eq(submissions.id, submissionId));

      logger.info(
        `Submission ${submissionId} processed successfully, ready for review`
      );
    } else {
      await db
        .update(submissions)
        .set({
          status: "FAILED",
          failureReason: errorMessage ?? "AI processing failed",
          updatedAt: new Date(),
        })
        .where(eq(submissions.id, submissionId));

      logger.error(
        `Submission ${submissionId} failed AI processing: ${errorMessage}`
      );
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

resultsWorker.on("completed", (job) =>
  logger.info(`Result job ${job.id} completed`)
);
resultsWorker.on("failed", (job, err) =>
  logger.error(`Result job ${job?.id} failed: ${err.message}`)
);
resultsWorker.on("error", (err) =>
  logger.error(`Results worker error: ${err.message}`)
);
