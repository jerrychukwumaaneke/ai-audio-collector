import app from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { startCleanupWorker } from "./workers/cleanup.worker";

app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);

  import("./workers/results.worker"); // self-initialises on import
  startCleanupWorker();

  logger.info("Workers initialised");
});
