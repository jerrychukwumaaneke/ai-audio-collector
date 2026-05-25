import { eq } from "drizzle-orm";
import { db } from "../db";
import { languages } from "../db/schema";

export async function createLanguage(data: { code: string; name: string }) {
  const existing = await getLanguageByCode(data.code);
  if (existing) {
    const err = Object.assign(new Error("A language with this code already exists"), {
      statusCode: 409,
    });
    throw err;
  }
  const [language] = await db.insert(languages).values(data).returning();
  return language;
}

export async function getAllLanguages() {
  return db.select().from(languages).orderBy(languages.name);
}

export async function getLanguageByCode(code: string) {
  const [language] = await db
    .select()
    .from(languages)
    .where(eq(languages.code, code));
  return language ?? null;
}

export async function deleteLanguage(code: string) {
  await db.delete(languages).where(eq(languages.code, code));
}
