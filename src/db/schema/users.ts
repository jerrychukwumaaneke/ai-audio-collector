import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").unique().notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  role: text("role", { enum: ["ADMIN", "USER", "REVIEWER"] })
    .default("USER")
    .notNull(),
  status: text("status", { enum: ["ACTIVE", "OFFLINE"] })
    .default("ACTIVE")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});



export const languages = pgTable("languages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),      
  code: text("code").notNull().unique(),      
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});


export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  text: text("text").notNull(),          
  createdBy: uuid("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});



export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .references(() => tasks.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  languageCode: text("language_code")
  .references(() => languages.code)
  .notNull(),
  audioUrl: text("audio_url").notNull(),
  status: text("status", {
    enum: ["PENDING","PROCESSING", "APPROVED", "REJECTED"]
  }).default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});


export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id")
    .references(() => submissions.id)
    .notNull(),
  reviewerId: uuid("reviewer_id")
    .references(() => users.id)
    .notNull(),
  decision: text("decision", {
    enum: ["APPROVED", "REJECTED"]
  }).notNull(),
  feedback: text("feedback"),        
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


