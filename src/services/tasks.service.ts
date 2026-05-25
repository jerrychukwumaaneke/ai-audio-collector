import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { languages, tasks, users } from "../db/schema";

export async function createTask(data: {
  prompt: string;
  description?: string;
  type: "READ_SPEECH" | "SPONTANEOUS_SPEECH";
  languageCode: string;
  createdBy: string;
}) {
  const [language] = await db
    .select()
    .from(languages)
    .where(eq(languages.code, data.languageCode))
    .limit(1);

  if (!language) {
    throw Object.assign(new Error("Language not found"), { statusCode: 400 });
  }

  const [task] = await db.insert(tasks).values(data).returning();
  return task;
}

export async function getAllTasks(filters?: {
  type?: "READ_SPEECH" | "SPONTANEOUS_SPEECH";
  languageCode?: string;
}) {
  let query = db
    .select({
      id: tasks.id,
      prompt: tasks.prompt,
      description: tasks.description,
      type: tasks.type,
      languageCode: tasks.languageCode,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      creatorId: users.id,
      creatorFirstName: users.firstName,
      creatorLastName: users.lastName,
    })
    .from(tasks)
    .leftJoin(users, eq(users.id, tasks.createdBy))
    .$dynamic();

  const conditions = [];

  if (filters?.type) {
    conditions.push(eq(tasks.type, filters.type));
  }

  if (filters?.languageCode) {
    conditions.push(eq(tasks.languageCode, filters.languageCode));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const rows = await query.orderBy(tasks.createdAt);

  return rows.map((row) => ({
    id: row.id,
    prompt: row.prompt,
    description: row.description,
    type: row.type,
    languageCode: row.languageCode,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: {
      id: row.creatorId,
      firstName: row.creatorFirstName,
      lastName: row.creatorLastName,
    },
  }));
}

export async function getTaskById(id: string) {
  const [row] = await db
    .select({
      id: tasks.id,
      prompt: tasks.prompt,
      description: tasks.description,
      type: tasks.type,
      languageCode: tasks.languageCode,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      creatorId: users.id,
      creatorFirstName: users.firstName,
      creatorLastName: users.lastName,
    })
    .from(tasks)
    .leftJoin(users, eq(users.id, tasks.createdBy))
    .where(eq(tasks.id, id));

  if (!row) return null;

  return {
    id: row.id,
    prompt: row.prompt,
    description: row.description,
    type: row.type,
    languageCode: row.languageCode,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: {
      id: row.creatorId,
      firstName: row.creatorFirstName,
      lastName: row.creatorLastName,
    },
  };
}

export async function updateTask(
  id: string,
  data: { prompt?: string; description?: string }
) {
  const [task] = await db
    .update(tasks)
    .set(data)
    .where(eq(tasks.id, id))
    .returning();
  return task;
}

export async function deleteTask(id: string) {
  await db.delete(tasks).where(eq(tasks.id, id));
}
