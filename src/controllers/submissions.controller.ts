import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  findSubmissionById,
  getAllSubmissions,
} from "../services/submission.services";
import { SUBMISSION_STATUSES } from "../db/schema/submissions";
import { sendError, sendSuccess } from "../utils/response";

const querySchema = z.object({
  status: z.enum(SUBMISSION_STATUSES).optional(),
  languageCode: z.string().optional(),
  userId: z.string().uuid("Invalid user ID").optional(),
});

export async function listSubmissions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(", "), 400);
      return;
    }

    const data = await getAllSubmissions(parsed.data);
    sendSuccess(res, data, "Submissions fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function fetchSubmission(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const submission = await findSubmissionById(req.params.id);
    if (!submission) {
      sendError(res, "Submission not found", 404);
      return;
    }
    sendSuccess(res, submission, "Submission fetched successfully");
  } catch (err) {
    next(err);
  }
}
