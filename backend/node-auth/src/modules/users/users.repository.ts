import { eq } from "drizzle-orm";
import { db } from "../../db/client.ts";
import { type NewUserRow, type UserRow, users } from "../../db/schema.ts";

// Única capa que conoce la base de datos.
export const usersRepository = {
  async findByEmail(email: string): Promise<UserRow | undefined> {
    const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return row;
  },

  async findById(id: string): Promise<UserRow | undefined> {
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return row;
  },

  /** Inserta y devuelve el usuario; undefined si el correo ya existe. */
  async insert(data: NewUserRow): Promise<UserRow | undefined> {
    const [row] = await db
      .insert(users)
      .values(data)
      .onConflictDoNothing({ target: users.email })
      .returning();
    return row;
  },
};
