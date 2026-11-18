import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors.ts";
import { type TokenClaims, verifyToken } from "../lib/jwt.ts";

declare global {
  namespace Express {
    interface Locals {
      user: TokenClaims;
    }
  }
}

/** Exige un JWT válido en Authorization: Bearer <token>. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new AppError(401, "NO_AUTENTICADO", "Falta el token de acceso");
  }
  try {
    res.locals.user = await verifyToken(token);
  } catch {
    throw new AppError(401, "TOKEN_INVALIDO", "El token es inválido o expiró");
  }
  next();
}
