import { z } from "zod";
import { pool } from "../db/client.ts";
import { logger } from "../lib/logger.ts";
import { usersRepository } from "../modules/users/users.repository.ts";
import { usersService } from "../modules/users/users.service.ts";

// Crea las cuentas de organizador y portero de demostración. Es idempotente.
const { SEED_ORGANIZER_PASSWORD, SEED_PORTER_PASSWORD } = z
  .object({
    SEED_ORGANIZER_PASSWORD: z.string().min(8),
    SEED_PORTER_PASSWORD: z.string().min(8),
  })
  .parse(process.env);

const seeds = [
  { name: "Organizador Demo", email: "organizador@entradasya.local", password: SEED_ORGANIZER_PASSWORD, role: "organizador" as const },
  { name: "Portero Demo", email: "portero@entradasya.local", password: SEED_PORTER_PASSWORD, role: "portero" as const },
];

for (const s of seeds) {
  if (await usersRepository.findByEmail(s.email)) {
    logger.info(`Ya existe ${s.email}`);
    continue;
  }
  await usersService.register({ name: s.name, email: s.email, password: s.password }, s.role);
  logger.info(`Creado ${s.email} (${s.role})`);
}
await pool.end();
