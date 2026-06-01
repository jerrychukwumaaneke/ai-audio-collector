import IORedis from "ioredis";
import { env } from "./env";
import { logger } from "../utils/logger";

export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redisConnection.on("connect", () => logger.info("Redis connected"));
redisConnection.on("error", (err) =>
  logger.error(`Redis error: ${err.message}`)
);
