import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.ts";
import { AppError } from "../lib/errors.ts";

const expected = Buffer.from(env.INTERNAL_API_TOKEN);

/** Rutas /internal: solo otros servicios con X-Internal-Token correcto. */
export function requireInternalToken(req: Request, _res: Response, next: NextFunction) {
  const given = Buffer.from(req.header("x-internal-token") ?? "");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    throw new AppError(401, "TOKEN_INTERNO_INVALIDO", "Falta o es inválido X-Internal-Token");
  }
  next();
}
