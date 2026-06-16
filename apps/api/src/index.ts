import http from "node:http";
import { logger } from "@repo/logger";
import { app as expressApplication } from "./server";
import { auth } from "@repo/auth";
import { getMigrations } from "better-auth/db/migration";

import { env } from "./env";

async function init() {
  try {
    // Auto-migrate Better Auth tables
    const { runMigrations } = await getMigrations(auth.options);
    await runMigrations();
    logger.info("database migrations complete");

    const server = http.createServer(expressApplication);
    const PORT: number = env.PORT ? +env.PORT : 8000;
    server.listen(PORT, () => {
      logger.info(`http server is running on PORT ${PORT}`);
    });
  } catch (err) {
    logger.error(`Error creating http server`, { err });
    process.exit(1);
  }
}

init();
