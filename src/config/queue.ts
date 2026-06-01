import { Queue } from "bullmq";
import { redisConnection } from "./redis";

export interface AudioJob {
  submissionId: string;
  audioUrl: string;
  audioLanguageCode: string;
  originalPrompt: string;
  originalPromptLanguageCode: string;
  supportedLanguageCodes: string[];
}

export interface AudioResultJob {
  submissionId: string;
  status: "success" | "failed";
  transcription?: string;
  translations?: { languageCode: string; text: string }[];
  errorMessage?: string;
}

export const audioProcessingQueue = new Queue("audio-processing", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 30000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export const audioResultsQueue = new Queue("audio-results", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});
