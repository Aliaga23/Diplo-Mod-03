import express from "express";
import { logger } from "./lib/logger.ts";
import { errorHandler, notFound } from "./middleware/error-handler.ts";
import { healthRouter } from "./modules/health/health.routes.ts";
import { notificationsRouter } from "./modules/notifications/notifications.routes.ts";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));

  // Una línea de log por petición.
  app.use((req, res, next) => {
    const start = performance.now();
    res.on("finish", () => {
      logger.info(
        { method: req.method, path: req.path, status: res.statusCode, ms: Math.round(performance.now() - start) },
        "petición",
      );
    });
    next();
  });

  app.use(healthRouter);
  app.use(notificationsRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
