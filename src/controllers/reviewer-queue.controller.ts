import { NextFunction, Request, Response } from "express";
import {
  getQueueSubmissionById,
  getReviewerQueue,
  getReviewerHistory,
  getReviewerStats,
  reviewSubmission,
} from "../services/reviewer-queue.services";
import { sendError, sendSuccess } from "../utils/response";
import { z } from "zod";



export async function getReviewerQueueHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reviewerId = req.user!.id;
    const queue = await getReviewerQueue(reviewerId);

    if (queue.length === 0) {
      sendSuccess(res, [], "No pending submissions in your queue");
      return;
    }

    sendSuccess(
      res,
      queue,
      `${queue.length} pending submission(s) in your queue`
    );
  } catch (err) {
    next(err);
  }
}


export async function getQueueSubmissionByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reviewerId = req.user!.id;
    const submission = await getQueueSubmissionById(
      req.params.id,
      reviewerId
    );

    if (!submission) {
      sendError(
        res,
        "Submission not found or not in your assigned languages",
        404
      );
      return;
    }

    sendSuccess(res, submission, "Submission fetched successfully");
  } catch (err) {
    next(err);
  }
}



const reviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"], {
    required_error: "Decision is required",
  }),
  feedback: z.string().min(1, "Feedback cannot be empty").optional(),
}).refine(
  (data) => {
    if (data.decision === "REJECTED" && !data.feedback) return false;
    return true;
  },
  { message: "Feedback is required when rejecting a submission" }
);


export async function reviewSubmissionHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const reviewerId = req.user!.id;

    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(", "), 400);
      return;
    }

    const { decision, feedback } = parsed.data;

    
    const submission = await getQueueSubmissionById(id, reviewerId);
    if (!submission) {
      sendError(
        res,
        "Submission not found or not in your assigned languages",
        404
      );
      return;
    }

    
    if (submission.status !== "PENDING") {
      sendError(
        res,
        `Submission has already been ${submission.status.toLowerCase()}`,
        400
      );
      return;
    }


    const review = await reviewSubmission(id, reviewerId, decision, feedback);
    sendSuccess(
      res,
      review,
      `Submission ${decision.toLowerCase()} successfully`
    );
  } catch (err) {
    next(err);
  }
}



export async function getReviewerHistoryHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reviewerId = req.user!.id;
    const history = await getReviewerHistory(reviewerId);
    sendSuccess(res, history, "Review history fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function getReviewerStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reviewerId = req.user!.id;
    const stats = await getReviewerStats(reviewerId);
    sendSuccess(res, stats, "Review stats fetched successfully");
  } catch (err) {
    next(err);
  }
}