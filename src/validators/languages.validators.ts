import { z } from "zod";

export const createLanguageSchema = z.object({
  code: z
    .string({ required_error: "Code is required" })
    .regex(/^[a-z]+$/, "Code must contain lowercase letters only"),
  name: z
    .string({ required_error: "Name is required" })
    .min(1, "Name cannot be empty")
    .trim(),
});
