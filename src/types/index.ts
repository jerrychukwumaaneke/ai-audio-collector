import { users } from "../db/schema";

export type User = typeof users.$inferSelect;
export type Role = User["role"];
export type UserStatus = User["status"];
