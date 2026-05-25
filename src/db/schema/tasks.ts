import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { languages } from "./languages";
import { users } from "./users";

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  prompt: text("prompt").notNull(),
  description: text("description"),
  type: text("type", { enum: ["READ_SPEECH", "SPONTANEOUS_SPEECH"] }).notNull(),
  languageCode: text("language_code")
    .references(() => languages.code)
    .notNull(),
  createdBy: uuid("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
