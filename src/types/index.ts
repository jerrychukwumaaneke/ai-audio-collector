export {};


// teaches TypeScript that req.user exists on every Express request, making it a global variable
import { users } from "../db/schema";

type UserProfile = typeof users.$inferSelect;

declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
    }
  }
}