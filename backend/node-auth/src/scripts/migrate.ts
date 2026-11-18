import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../db/client.ts";
import { logger } from "../lib/logger.ts";

// Aplica las migraciones SQL de ./drizzle (generadas con pnpm db:generate).
await migrate(db, { migrationsFolder: "./drizzle" });
logger.info("Migraciones aplicadas");
await pool.end();
