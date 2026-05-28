import { Request, Response } from "express";
import { z } from "zod";
import {
  getPendingReviews,
  getReviewById,
  approveReview,
  correctReview,
} from "../services/review.service";
import { sendError, sendSuccess } from "../utils/response";

const correctSchema = z.object({
  cleanTranscription: z.string().min(1).optional(),
  translation: z
    .object({
      Yoruba: z.string().optional(),
      Hausa: z.string().optional(),
      Igbo: z.string().optional(),
    })
    .optional(),
});

// GET /api/reviews/pending
export async function getPending(req: Request, res: Response): Promise<void> {
  try {
    const records = await getPendingReviews();
    sendSuccess(res, records, "Pending reviews fetched");
  } catch (err) {
    sendError(res, "Failed to fetch pending reviews", 500);
  }
}

// GET /api/reviews/:id
export async function getOne(req: Request, res: Response): Promise<void> {
  try {
    const record = await getReviewById(req.params.id);
    if (!record) {
      sendError(res, "Record not found", 404);
      return;
    }
    sendSuccess(res, record, "Record fetched");
  } catch (err) {
    sendError(res, "Failed to fetch record", 500);
  }
}

// PATCH /api/reviews/:id/approve
export async function approve(req: Request, res: Response): Promise<void> {
  try {
    const record = await getReviewById(req.params.id);
    if (!record) {
      sendError(res, "Record not found", 404);
      return;
    }
    if (record.status !== "pending_review") {
      sendError(res, `Record is already ${record.status}`, 400);
      return;
    }

    const updated = await approveReview(req.params.id);
    sendSuccess(res, updated, "Record approved");
  } catch (err) {
    sendError(res, "Failed to approve record", 500);
  }
}

// PATCH /api/reviews/:id/correct
export async function correct(req: Request, res: Response): Promise<void> {
  try {
    const record = await getReviewById(req.params.id);
    if (!record) {
      sendError(res, "Record not found", 404);
      return;
    }
    if (record.status !== "pending_review") {
      sendError(res, `Record is already ${record.status}`, 400);
      return;
    }

    const parsed = correctSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(", ");
      sendError(res, message, 400);
      return;
    }

    if (!parsed.data.cleanTranscription && !parsed.data.translation) {
      sendError(res, "Provide at least one correction field", 400);
      return;
    }

    const updated = await correctReview(req.params.id, parsed.data);
    sendSuccess(res, updated, "Record corrected and approved");
  } catch (err) {
    sendError(res, "Failed to correct record", 500);
  }
}