import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { audioSamples } from "../db/schema/audio_samples";

// All records waiting for a human reviewer
export async function getPendingReviews() {
  return db
    .select()
    .from(audioSamples)
    .where(eq(audioSamples.status, "pending_review"));
}

// Single record by ID
export async function getReviewById(id: string) {
  const [record] = await db
    .select()
    .from(audioSamples)
    .where(eq(audioSamples.id, id));
  return record ?? null;
}

// Reviewer approved with no changes
export async function approveReview(id: string) {
  const [updated] = await db
    .update(audioSamples)
    .set({ status: "approved" })
    .where(eq(audioSamples.id, id))
    .returning();
  return updated;
}

// Reviewer made corrections — merge with existing and approve
export async function correctReview(
  id: string,
  corrections: {
    cleanTranscription?: string;
    translation?: {
      Yoruba?: string;
      Hausa?: string;
      Igbo?: string;
      [key: string]: string | undefined;
    };
  }
) {
  const existing = await getReviewById(id);
  if (!existing) throw new Error("Record not found");

  // Merge corrections into existing translations
  // Only the fields the reviewer changed are overwritten
  const mergedTranslation = corrections.translation
    ? {
        ...(existing.translation as object ?? {}),
        ...corrections.translation,
      }
    : existing.translation;

  const [updated] = await db
    .update(audioSamples)
    .set({
      ...(corrections.cleanTranscription && {
        cleanTranscription: corrections.cleanTranscription,
      }),
      translation: mergedTranslation,
      status: "approved",
    })
    .where(eq(audioSamples.id, id))
    .returning();

  return updated;
}