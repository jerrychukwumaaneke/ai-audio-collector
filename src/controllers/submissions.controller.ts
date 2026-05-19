import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  findSubmissionById,
  getAllSubmissions,
} from "../services/submission.services";
import { sendError, sendSuccess } from "../utils/response";

const querySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  languageId: z.string().uuid("Invalid language ID").optional(),
  userId: z.string().uuid("Invalid user ID").optional(),
});

export async function getAllSubmissionsHandler(
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

export async function getSubmissionByIdHandler(
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