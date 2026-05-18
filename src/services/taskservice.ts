import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { tasks } from "../db/schema";

export type NewTask = typeof tasks.$inferInsert;

// createTask no longer needs languageIds since there is no taskLanguages table
export async function createTask(data: NewTask) {
  const [task] = await db.insert(tasks).values(data).returning();
  return task;
}

export async function getAllTasks() {
  return await db
    .select({
      id: tasks.id,
      text: tasks.text,
      createdBy: tasks.createdBy,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .orderBy(tasks.createdAt);
}

export async function findTaskById(id: string) {
  const [task] = await db
    .select({
      id: tasks.id,
      text: tasks.text,
      createdBy: tasks.createdBy,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .where(eq(tasks.id, id));

  return task ?? null;
}

export async function updateTask(
  id: string,
  data: Partial<Pick<NewTask, "text">>
) {
  const [updated] = await db
    .update(tasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();

  return updated ?? null;
}


export async function deleteTask(id: string) {
  const [deleted] = await db
    .delete(tasks)
    .where(eq(tasks.id, id))
    .returning();

  return deleted ?? null;
}
