import { NextFunction, Request, Response } from "express";
import {
  cancelSubmission,
  confirmSubmission,
  getSubmissionById,
  getSubmissions,
  prepareSubmission,
} from "../services/submissions.service";
import { sendError, sendSuccess } from "../utils/response";
import {
  listSubmissionsSchema,
  prepareSubmissionSchema,
} from "../validators/submissions.validators";

export async function prepare(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = prepareSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(", "), 400);
      return;
    }

    const { taskId, audioLanguageCode } = parsed.data;

    const { submission, uploadUrl, expiresIn } = await prepareSubmission({
      taskId,
      userId: req.user!.id,
      audioLanguageCode,
      requestingUser: req.user!,
    });

    res.status(201).json({
      success: true,
      data: {
        submissionId: submission.id,
        uploadUrl,
        expiresIn,
        uploadInstructions: {
          method: "PUT",
          note: "Upload your audio file directly to uploadUrl using a PUT request, then call the confirm endpoint",
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function confirm(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const submission = await confirmSubmission(req.params.id, req.user!);
    sendSuccess(res, submission, "Submission confirmed successfully");
  } catch (err) {
    next(err);
  }
}

export async function listSubmissions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = listSubmissionsSchema.safeParse(req.query);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(", "), 400);
      return;
    }

    const submissions = await getSubmissions(req.user!, parsed.data);
    sendSuccess(res, submissions, "Submissions fetched successfully");
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
    const submission = await getSubmissionById(req.params.id, req.user!);
    sendSuccess(res, submission, "Submission fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function removeSubmission(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await cancelSubmission(req.params.id, req.user!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
