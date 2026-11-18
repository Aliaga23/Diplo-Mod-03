import { z } from "zod";

// Toda la configuración sale de variables de entorno (sección 8.1).
// Si falta algo, el servicio no arranca y dice qué falta.
const EnvSchema = z.object({
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4001),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
  JWT_ISSUER: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default("2h"),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      JSON.stringify({
        time: new Date().toISOString(),
        level: "fatal",
        service: "auth",
        msg: "Configuración inválida",
        issues: z.flattenError(parsed.error).fieldErrors,
      }),
    );
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
