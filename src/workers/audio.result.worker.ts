import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/queue.js";
import { supabaseAdmin } from "../config/supabase.js";
import { db } from "../db/index.js";
import { audioSamples } from "../db/schema/audio_samples.js";
import { eq } from "drizzle-orm";
import { logger } from "../utils/logger.js";

// Exact shape the Python worker pushes to audio-results queue
interface AudioResult {
  recordId: string;
  status: "SUCCESS" | "FAILED";
  processedAudioUrl: string;
  original_file: string;
  raw_english: string;
  clean_english: string;
  translations: {
    Yoruba: string;
    Hausa: string;
    Igbo: string;
    [key: string]: string; // allows more languages in future
  };
  error?: string;
}

export const startResultsWorker = () => {
  const worker = new Worker(
    "audio-results",
    async (job: Job<AudioResult>) => {
      const {
        recordId,
        status,
        processedAudioUrl,
        raw_english,
        clean_english,
        translations,
        error,
      } = job.data;

      logger.info(`Processing result for record: ${recordId}`);

      // Handle failure reported by Python worker
      if (status !== "SUCCESS") {
        await db
          .update(audioSamples)
          .set({ status: "failed" })
          .where(eq(audioSamples.id, recordId));

        logger.error(`Python worker reported failure for ${recordId}: ${error}`);
        return;
      }

      // Download processed audio and re-upload to your Supabase bucket
      const audioResponse = await fetch(processedAudioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to fetch processed audio: ${audioResponse.statusText}`);
      }

      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
      const processedFileName = `processed/${recordId}-processed.wav`;

      const { error: storageError } = await supabaseAdmin
        .storage
        .from("audio-files")
        .upload(processedFileName, audioBuffer, {
          contentType: "audio/wav",
          upsert: true,
        });

      if (storageError) {
        throw new Error(`Storage Error: ${storageError.message}`);
      }

      const { data: publicUrlData } = supabaseAdmin
        .storage
        .from("audio-files")
        .getPublicUrl(processedFileName);

      // Delete the original audio now that processed version is saved
      const record = await db.query.audioSamples.findFirst({
        where: eq(audioSamples.id, recordId),
      });

      if (record?.fileUrl) {
        const originalPath = new URL(record.fileUrl).pathname.replace(
          "/storage/v1/object/public/audio-files/",
          ""
        );
        await supabaseAdmin.storage.from("audio-files").remove([originalPath]);
        logger.info(`Original audio deleted: ${originalPath}`);
      }

      // Update DB record with all results from Python worker
      await db
        .update(audioSamples)
        .set({
          processedFileUrl: publicUrlData.publicUrl,
          rawTranscription: raw_english,
          cleanTranscription: clean_english,
          translation: translations,
          status: "pending_review",
        })
        .where(eq(audioSamples.id, recordId));

      logger.info(`Record ${recordId} saved and ready for review`);
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    logger.info(`Result job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Result job ${job?.id} failed: ${err.message}`);
  });

  logger.info("Results worker started — listening on audio-results queue");

  return worker;
};