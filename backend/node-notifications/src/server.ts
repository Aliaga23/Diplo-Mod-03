import { createApp } from "./app.ts";
import { env } from "./config/env.ts";
import { logger } from "./lib/logger.ts";
import { transporter } from "./lib/mailer.ts";

const server = createApp().listen(env.PORT, env.HOST, () => {
  logger.info(`notifications escuchando en http://${env.HOST}:${env.PORT}`);
});

function shutdown(signal: string) {
  logger.info(`${signal} recibido, cerrando`);
  server.close(() => {
    transporter.close();
    process.exit(0);
  });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
