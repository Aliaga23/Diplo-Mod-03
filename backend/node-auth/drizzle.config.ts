import { defineConfig } from "drizzle-kit";

// Solo se usa para GENERAR migraciones a partir de src/db/schema.ts (pnpm db:generate).
// Aplicarlas lo hace src/scripts/migrate.ts (pnpm db:migrate).
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});
