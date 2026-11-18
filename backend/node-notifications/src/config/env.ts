import { z } from "zod";

// Toda la configuración sale de variables de entorno (sección 8.1).
// Si falta algo, el servicio no arranca y dice qué falta.
const EnvSchema = z.object({
  HOST: z.string().default("127.0.0.1"), // servicio interno: solo localhost
  PORT: z.coerce.number().int().positive().default(4006),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  INTERNAL_API_TOKEN: z.string().min(16),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  MAIL_FROM: z.string().min(3),
  WEB_BASE_URL: z.url(),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      JSON.stringify({
        time: new Date().toISOString(),
        level: "fatal",
        service: "notifications",
        msg: "Configuración inválida",
        issues: z.flattenError(parsed.error).fieldErrors,
      }),
    );
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
