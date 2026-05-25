import { z } from "zod";

export const createTaskSchema = z.object({
  prompt: z
    .string({ required_error: "Prompt is required" })
    .min(1, "Prompt cannot be empty")
    .trim(),
  description: z.string().trim().optional(),
  type: z.enum(["READ_SPEECH", "SPONTANEOUS_SPEECH"], {
    required_error: "Type is required",
    message: "Type must be READ_SPEECH or SPONTANEOUS_SPEECH",
  }),
  languageCode: z
    .string({ required_error: "Language code is required" })
    .min(1, "Language code cannot be empty"),
});

export const updateTaskSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty").trim().optional(),
  description: z.string().min(1, "Description cannot be empty").trim().optional(),
});
