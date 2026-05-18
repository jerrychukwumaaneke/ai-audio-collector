import { and, eq, inArray } from "drizzle-orm";
import { db } from "../config/db";
import { languages, reviewerLanguages, users } from "../db/schema";



export async function assignLanguagesToReviewer(
  reviewerId: string,
  languageIds: string[]
) {
  return await db.transaction(async (tx) => {
    // remove existing assignments for this reviewer
    await tx
      .delete(reviewerLanguages)
      .where(eq(reviewerLanguages.reviewerId, reviewerId));



    // insert new assignments
    await tx.insert(reviewerLanguages).values(
      languageIds.map((languageId) => ({ reviewerId, languageId }))
    );
  });
}



export async function getReviewerWithLanguages(reviewerId: string) {
  const rows = await db
    .select({
      reviewerId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      status: users.status,
      languageId: languages.id,
      languageName: languages.name,
      languageCode: languages.code,
    })
    .from(users)
    .leftJoin(reviewerLanguages, eq(reviewerLanguages.reviewerId, users.id))
    .leftJoin(languages, eq(languages.id, reviewerLanguages.languageId))
    .where(eq(users.id, reviewerId));

  if (!rows.length) return null;

  return {
    id: rows[0].reviewerId,
    firstName: rows[0].firstName,
    lastName: rows[0].lastName,
    email: rows[0].email,
    status: rows[0].status,
    languages: rows
      .filter((r) => r.languageId)
      .map((r) => ({
        id: r.languageId,
        name: r.languageName,
        code: r.languageCode,
      })),
  };
}



export async function getAllReviewersWithLanguages() {
  const rows = await db
    .select({
      reviewerId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      status: users.status,
      languageId: languages.id,
      languageName: languages.name,
      languageCode: languages.code,
    })
    .from(users)
    .leftJoin(reviewerLanguages, eq(reviewerLanguages.reviewerId, users.id))
    .leftJoin(languages, eq(languages.id, reviewerLanguages.languageId))
    .where(eq(users.role, "REVIEWER"))
    .orderBy(users.createdAt);

  return groupReviewersWithLanguages(rows);
}


export async function removeLanguagesFromReviewer(
  reviewerId: string,
  languageIds: string[]
) {
  await db
    .delete(reviewerLanguages)
    .where(
      and(
        eq(reviewerLanguages.reviewerId, reviewerId),
        inArray(reviewerLanguages.languageId, languageIds)
      )
    );
}


export async function validateReviewerLanguageIds(languageIds: string[]) {
  const found = await db
    .select({ id: languages.id })
    .from(languages)
    .where(
      and(
        inArray(languages.id, languageIds),
      )
    );
  return found.map((l) => l.id);
}



// groups flat join rows into reviewers with nested languages array
// basically when a particular user uses more than a language, this function just classifies the particular user into just one function 
// and group all the languages in just a single function call instead of differnt rows
// eg "languages": [
    //   { "id": "1", "name": "English" },
    //   { "id": "2", "name": "Yoruba" },
    //   { "id": "3", "name": "Pidgin" }
    // ]
function groupReviewersWithLanguages(
  rows: {
    reviewerId: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    languageId: string | null;
    languageName: string | null;
    languageCode: string | null;
  }[]
) {
  const map = new Map<string, {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    languages: { id: string; name: string; code: string }[];
  }>();

  for (const row of rows) {
    if (!map.has(row.reviewerId)) {
      map.set(row.reviewerId, {
        id: row.reviewerId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        status: row.status,
        languages: [],
      });
    }


    if (row.languageId && row.languageName && row.languageCode) {
      map.get(row.reviewerId)!.languages.push({
        id: row.languageId,
        name: row.languageName,
        code: row.languageCode,
      });
    }
  }

  return Array.from(map.values());
}