import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const USER_ROLES = ["ADMIN", "USER", "REVIEWER"] as const;
export const USER_STATUSES = ["ACTIVE", "OFFLINE"] as const;

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").unique().notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  role: text("role", { enum: USER_ROLES }).default("USER").notNull(),
  status: text("status", { enum: USER_STATUSES }).default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});