import http from "node:http";
import { Pool } from "pg";
import { logger } from "@repo/logger";
import { app as expressApplication } from "./server";
import { auth } from "@repo/auth";
import { getMigrations } from "better-auth/db/migration";
import { corsair } from "./corsair";
import { env } from "./env";

async function bootstrap() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // 1. Corsair tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS corsair_integrations (id TEXT PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), name TEXT NOT NULL, config JSONB NOT NULL DEFAULT '{}', dek TEXT NULL);
    CREATE TABLE IF NOT EXISTS corsair_accounts (id TEXT PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), tenant_id TEXT NOT NULL, integration_id TEXT NOT NULL REFERENCES corsair_integrations(id), config JSONB NOT NULL DEFAULT '{}', dek TEXT NULL);
    CREATE TABLE IF NOT EXISTS corsair_entities (id TEXT PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), account_id TEXT NOT NULL REFERENCES corsair_accounts(id), entity_id TEXT NOT NULL, entity_type TEXT NOT NULL, version TEXT NOT NULL, data JSONB NOT NULL DEFAULT '{}');
    CREATE TABLE IF NOT EXISTS corsair_events (id TEXT PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), account_id TEXT NOT NULL REFERENCES corsair_accounts(id), event_type TEXT NOT NULL, payload JSONB NOT NULL DEFAULT '{}', status TEXT);
  `);

  // 1b. App tables (threads, messages, onboarding)
  await pool.query(`
    DO $$ BEGIN CREATE TYPE message_role AS ENUM ('user', 'assistant', 'tool', 'system'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    CREATE TABLE IF NOT EXISTS threads (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id TEXT NOT NULL, title VARCHAR(255), pinned BOOLEAN DEFAULT false, archived BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS messages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE, role message_role NOT NULL, content TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
    CREATE INDEX IF NOT EXISTS idx_corsair_accounts_tenant ON corsair_accounts(tenant_id);
    ALTER TABLE threads ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false;
    ALTER TABLE threads ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
  `);

  await pool.end();

  // 2. Better Auth tables
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();

  // 3. Corsair integration credentials (integration-level only, no accounts)
  try {
    await corsair.keys.gmail.set_client_id(process.env.GOOGLE_CLIENT_ID!);
    await corsair.keys.gmail.set_client_secret(process.env.GOOGLE_CLIENT_SECRET!);
    await corsair.keys.googlecalendar.set_client_id(process.env.GOOGLE_CLIENT_ID!);
    await corsair.keys.googlecalendar.set_client_secret(process.env.GOOGLE_CLIENT_SECRET!);
  } catch { /* already set */ }

  logger.info("bootstrap complete");
}

async function init() {
  try {
    await bootstrap();

    const server = http.createServer(expressApplication);
    const PORT = env.PORT ? +env.PORT : 8000;
    server.listen(PORT, () => logger.info(`server running on port ${PORT}`));
  } catch (err) {
    logger.error("fatal startup error", { err });
    process.exit(1);
  }
}

init();
