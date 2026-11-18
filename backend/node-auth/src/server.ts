import { createApp } from "./app.ts";
import { env } from "./config/env.ts";
import { pool } from "./db/client.ts";
import { logger } from "./lib/logger.ts";

const server = createApp().listen(env.PORT, env.HOST, () => {
  logger.info(`auth escuchando en http://${env.HOST}:${env.PORT}`);
});

function shutdown(signal: string) {
  logger.info(`${signal} recibido, cerrando`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
