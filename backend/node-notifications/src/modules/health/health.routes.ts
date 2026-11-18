import { Router } from "express";
import { smtpReachable } from "../../lib/mailer.ts";

export const healthRouter = Router();

// Vivo: el proceso responde.
healthRouter.get("/health/live", (_req, res) => {
  res.json({ status: "ok" });
});

// Listo: además puede conectarse al servidor SMTP (Mailpit).
healthRouter.get("/health/ready", async (_req, res) => {
  const ok = await smtpReachable();
  res.status(ok ? 200 : 503).json({ status: ok ? "ok" : "error", checks: { smtp: ok ? "ok" : "error" } });
});
