import type { NextFunction, Request, Response } from "express";
import { ZodError, z } from "zod";
import { AppError } from "../lib/errors.ts";
import { logger } from "../lib/logger.ts";

// Formato único de error del contrato: { error: { code, message } }.
export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: { code: "NO_ENCONTRADO", message: "Ruta no encontrada" } });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: { code: "DATOS_INVALIDOS", message: z.prettifyError(err) } });
    return;
  }
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: { code: "JSON_INVALIDO", message: "El cuerpo no es JSON válido" } });
    return;
  }
  logger.error({ err, path: req.path }, "Error no controlado");
  res.status(500).json({ error: { code: "ERROR_INTERNO", message: "Error interno del servidor" } });
}
