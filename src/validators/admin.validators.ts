import { z } from "zod";
import { USER_ROLES, USER_STATUSES } from "../db/schema/users";

export const listUsersQuerySchema = z.object({
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const updateRoleSchema = z.object({
  role: z.enum(USER_ROLES, { required_error: "Role is required" }),
});

export const updateStatusSchema = z.object({
  status: z.enum(USER_STATUSES, {
    required_error: "Status is required",
    message: "Status must be ACTIVE or OFFLINE",
  }),
});
