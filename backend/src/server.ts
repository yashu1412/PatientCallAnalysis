import { env } from "./config/env";
import { connectDB } from "./config/db";
import { logger } from "./utils/logger";
import app from "./app";

const start = async () => {
  await connectDB();

  app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT}`);
    logger.info(`Frontend allowed at ${env.FRONTEND_URL}`);
  });
};

start().catch((err) => {
  logger.error("Failed to start server", { err });
  process.exit(1);
});
