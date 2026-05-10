import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export async function createUserProfile(data: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}) {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

export async function findUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  return user ?? null;
}

export async function findUserById(id: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id));
  return user ?? null;
}
