import { pgTable, uuid, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const audioSamples = pgTable("audio_samples", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  language: text("language").notNull(),

  // Original upload
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name"),
  mimeType: text("mime_type"),
  size: integer("size"),

  // Set by AI result worker
  processedFileUrl: text("processed_file_url"),
  rawTranscription: text("raw_transcription"),
  cleanTranscription: text("clean_transcription"),
  translation: jsonb("translation"),

  // pending | failed | pending_review | approved
  status: text("status").default("pending"),

  createdAt: timestamp("created_at").defaultNow(),
});