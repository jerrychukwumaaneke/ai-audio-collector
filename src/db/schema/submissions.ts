import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { languages } from "./languages";
import { tasks } from "./tasks";
import { users } from "./users";

export const SUBMISSION_STATUSES = [
  "AWAITING_UPLOAD",
  "PENDING",
  "PROCESSING",
  "READY_FOR_REVIEW",
  "APPROVED",
  "REJECTED",
  "FAILED",
] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .references(() => tasks.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  audioUrl: text("audio_url"),
  audioLanguageCode: text("audio_language_code")
    .references(() => languages.code)
    .notNull(),
  status: text("status", { enum: SUBMISSION_STATUSES })
    .default("AWAITING_UPLOAD")
    .notNull(),
  failureReason: text("failure_reason"),
  storagePath: text("storage_path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => ({
  userIdIdx: index("submissions_user_id_idx").on(table.userId),
  taskIdIdx: index("submissions_task_id_idx").on(table.taskId),
  statusIdx: index("submissions_status_idx").on(table.status),
  audioLanguageCodeIdx: index("submissions_audio_language_code_idx").on(table.audioLanguageCode),
}));

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id")
    .references(() => submissions.id)
    .notNull(),
  reviewerId: uuid("reviewer_id")
    .references(() => users.id)
    .notNull(),
  decision: text("decision", { enum: ["APPROVED", "REJECTED"] }).notNull(),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
