import type { Role, UserRow } from "../../db/schema.ts";
import { AppError } from "../../lib/errors.ts";
import { signToken } from "../../lib/jwt.ts";
import { hashPassword, verifyPassword } from "../../lib/password.ts";
import type { LoginInput, RegisterInput } from "./users.schemas.ts";
import { usersRepository } from "./users.repository.ts";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

const toPublic = (u: UserRow): PublicUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt.toISOString(),
});

const issueToken = (u: UserRow) =>
  signToken({ sub: u.id, role: u.role, email: u.email, name: u.name });

export const usersService = {
  /** Crea un usuario. El registro público siempre crea el rol cliente. */
  async register(input: RegisterInput, role: Role = "cliente") {
    const created = await usersRepository.insert({
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role,
    });
    if (!created) throw new AppError(409, "EMAIL_EN_USO", "Ya existe una cuenta con ese correo");
    return { token: await issueToken(created), user: toPublic(created) };
  },

  async login(input: LoginInput) {
    const user = await usersRepository.findByEmail(input.email);
    // Mismo mensaje si no existe o si la contraseña no coincide: no revela qué correos existen.
    if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
      throw new AppError(401, "CREDENCIALES_INVALIDAS", "Correo o contraseña incorrectos");
    }
    return { token: await issueToken(user), user: toPublic(user) };
  },

  async me(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new AppError(404, "USUARIO_NO_ENCONTRADO", "El usuario no existe");
    return { user: toPublic(user) };
  },
};
