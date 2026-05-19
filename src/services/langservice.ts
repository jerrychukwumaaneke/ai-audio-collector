import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { languages } from "../db/schema";

export type NewLanguage = typeof languages.$inferInsert;

export async function createLanguage(data: NewLanguage) {
  const [language] = await db.insert(languages).values(data).returning();
  return language;
}

export async function getAllLanguages() {
  return await db.select().from(languages).orderBy(languages.createdAt);
}

export async function findLanguageById(id: string) {
  const [language] = await db
    .select()
    .from(languages)
    .where(eq(languages.id, id));
  return language ?? null;
}

export async function findLanguageByName(name: string) {
  const [language] = await db
    .select()
    .from(languages)
    .where(eq(languages.name, name));
  return language ?? null;
}

export async function findLanguageByCode(code: string) {
  const [language] = await db
    .select()
    .from(languages)
    .where(eq(languages.code, code));
  return language ?? null;
}

export async function updateLanguage(
  id: string,
  data: Partial<Pick<NewLanguage, "name" | "code" >>
) {
  const [updated] = await db
    .update(languages)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(languages.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteLanguage(id: string) {
  const [deleted] = await db
    .delete(languages)
    .where(eq(languages.id, id))
    .returning();
  return deleted ?? null;
}