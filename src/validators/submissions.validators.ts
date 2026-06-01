import { z } from "zod";

export const prepareSubmissionSchema = z.object({
  taskId: z.string().uuid("taskId must be a valid UUID"),
  audioLanguageCode: z.string().min(1, "audioLanguageCode is required"),
});

export const listSubmissionsSchema = z.object({
  taskId: z.string().uuid().optional(),
  status: z.string().optional(),
  audioLanguageCode: z.string().optional(),
});
