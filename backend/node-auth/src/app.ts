import express from "express";
import { logger } from "./lib/logger.ts";
import { errorHandler, notFound } from "./middleware/error-handler.ts";
import { healthRouter } from "./modules/health/health.routes.ts";
import { usersRouter } from "./modules/users/users.routes.ts";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", "loopback"); // detrás de Nginx
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
  app.use(usersRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
