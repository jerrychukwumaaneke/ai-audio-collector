import app from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { startResultsWorker } from "./workers/audio.result.worker";

app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
  startResultsWorker();
});