import { hash, verify } from "@node-rs/argon2";

// Las contraseñas se guardan cifradas con argon2id, nunca en texto plano.
export const hashPassword = (plain: string): Promise<string> => hash(plain);

export const verifyPassword = (hashed: string, plain: string): Promise<boolean> =>
  verify(hashed, plain);
