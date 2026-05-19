import { eq } from "drizzle-orm";
import { or, ilike } from "drizzle-orm";
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


export type UserRole = "ADMIN" | "USER" | "REVIEWER";
export type UserStatus = "ACTIVE" | "OFFLINE";


export async function getAllUsers(filters?: {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}) {
  let query = db.select().from(users).$dynamic();

  if (filters?.role) {
    query = query.where(eq(users.role, filters.role));
  }

  if (filters?.status) {
    query = query.where(eq(users.status, filters.status));
  }

  if (filters?.search) {
    query = query.where(
      or(
        ilike(users.firstName, `%${filters.search}%`),
        ilike(users.lastName, `%${filters.search}%`),
        ilike(users.email, `%${filters.search}%`)
      )
    );
  }

  return await query.orderBy(users.createdAt);
}



export async function updateUserRole(id: string, role: UserRole) {
  const [updated] = await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return updated ?? null;
}



export async function updateUserStatus(id: string, status: UserStatus) {
  const [updated] = await db
    .update(users)
    .set({ status, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteUser(id: string) {
  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();
  return deleted ?? null;
}