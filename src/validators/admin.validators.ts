import { z } from "zod";

export const listUsersQuerySchema = z.object({
  role: z.enum(["ADMIN", "USER", "REVIEWER"]).optional(),
  status: z.enum(["ACTIVE", "OFFLINE"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "USER", "REVIEWER"], {
    required_error: "Role is required",
  }),
});

export const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "OFFLINE"], {
    required_error: "Status is required",
    invalid_type_error: "Status must be ACTIVE or OFFLINE",
  }),
});
