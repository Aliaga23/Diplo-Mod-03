import { pino } from "pino";
import { env } from "../config/env.ts";

// Logs en consola, una línea JSON por evento: time, level, msg (sección 8.6).
// notifications no tiene base de datos: su registro son estos logs.
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: "notifications" },
  messageKey: "msg",
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: { level: (label) => ({ level: label }) },
});
