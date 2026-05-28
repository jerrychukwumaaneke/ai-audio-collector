import { and, count, eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { Role, UserStatus } from "../types";

export async function createUserProfile(data: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}) {
  const [user] = await db
  .insert(users)
  .values({
      id: data.id,
      email: data.email,
      firstName: data.firstName, 
      lastName: data.lastName,   
      phone: data.phone,
    }
  ).returning();
  return user;
}

export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user ?? null;
}

export async function findUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}

export async function updateUserProfile(
  id: string,
  data: { firstName?: string; lastName?: string; phone?: string }
) {
  const [user] = await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning();
  return user ?? null;
}

export async function getAllUsers({
  role,
  status,
  page = 1,
  limit = 20,
}: {
  role?: Role;
  status?: UserStatus;
  page?: number;
  limit?: number;
}) {
  const conditions = [];
  if (role) conditions.push(eq(users.role, role));
  if (status) conditions.push(eq(users.status, status));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(users)
    .where(whereClause);

  const data = await db
    .select()
    .from(users)
    .where(whereClause)
    .orderBy(users.createdAt)
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateUserRole(id: string, role: Role) {
  const [updated] = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, id))
    .returning();
  return updated ?? null;
}

export async function updateUserStatus(id: string, status: UserStatus) {
  const [updated] = await db
    .update(users)
    .set({ status })
    .where(eq(users.id, id))
    .returning();
  return updated ?? null;
}
