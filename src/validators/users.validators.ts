import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z
    .string({ required_error: "First name is required" })
    .min(1, "First name cannot be empty")
    .optional(),
  lastName: z
    .string({ required_error: "Last name is required" })
    .min(1, "Last name cannot be empty")
    .optional(),
  phone: z
    .string({ required_error: "Phone is required" })
    .regex(
      /^\+?[0-9]{7,15}$/,
      "Phone must be a valid number (7–15 digits, optional leading + or 0)"
    )
    .optional(),
});
