import { Router } from "express";
import { pingDatabase } from "../../db/client.ts";

export const healthRouter = Router();

// Vivo: el proceso responde.
healthRouter.get("/health/live", (_req, res) => {
  res.json({ status: "ok" });
});

// Listo: además puede llegar a su base de datos.
healthRouter.get("/health/ready", async (_req, res) => {
  const dbOk = await pingDatabase();
  res
    .status(dbOk ? 200 : 503)
    .json({ status: dbOk ? "ok" : "error", checks: { database: dbOk ? "ok" : "error" } });
});
