export * from "./users";

import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { users, languages } from "./users";

export const reviewerLanguages = pgTable("reviewer_languages", {
  id: uuid("id").primaryKey().defaultRandom(),
  reviewerId: uuid("reviewer_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  languageId: uuid("language_id")
    .references(() => languages.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


export type ReviewerLanguage = typeof reviewerLanguages.$inferSelect;