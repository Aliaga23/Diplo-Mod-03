import { pino } from "pino";
import { env } from "../config/env.ts";

// Logs en consola, una línea JSON por evento: time, level, msg (sección 8.6).
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: "auth" },
  messageKey: "msg",
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: { level: (label) => ({ level: label }) },
});
