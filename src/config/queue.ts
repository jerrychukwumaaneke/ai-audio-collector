import { Queue } from "bullmq";
import IORedis from "ioredis";

export const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null, // Required by BullMQ
});

// Queue your backend pushes jobs TO (Python worker reads from this)
export const audioQueue = new Queue("audio-processing", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Queue your backend LISTENS ON (Python worker pushes results here)
export const resultsQueue = new Queue("audio-results", {
  connection: redisConnection,
});