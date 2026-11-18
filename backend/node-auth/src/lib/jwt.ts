import { jwtVerify, SignJWT } from "jose";
import { env } from "../config/env.ts";
import type { Role } from "../db/schema.ts";

// HS256 con secreto compartido: los demás servicios validan el token por su cuenta (sección 4.2).
const key = new TextEncoder().encode(env.JWT_SECRET);

export interface TokenClaims {
  sub: string;
  role: Role;
  email: string;
  name: string;
}

export async function signToken(claims: TokenClaims): Promise<string> {
  return new SignJWT({ role: claims.role, email: claims.email, name: claims.name })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setIssuer(env.JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(key);
}

export async function verifyToken(token: string): Promise<TokenClaims> {
  const { payload } = await jwtVerify(token, key, {
    issuer: env.JWT_ISSUER,
    algorithms: ["HS256"],
  });
  return {
    sub: String(payload.sub),
    role: payload["role"] as Role,
    email: String(payload["email"]),
    name: String(payload["name"]),
  };
}
