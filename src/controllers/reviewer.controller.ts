import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { findUserById } from "../services/user.service";
import {
  assignLanguagesToReviewer,
  getAllReviewersWithLanguages,
  getReviewerWithLanguages,
  removeLanguagesFromReviewer,
  validateReviewerLanguageIds,
} from "../services/reviewer.service";
import { sendError, sendSuccess } from "../utils/response";

const assignLanguagesSchema = z.object({
  languageIds: z
    .array(z.string().uuid("Invalid language ID"))
    .min(1, "At least one language is required"),
});


export async function getAllReviewersHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await getAllReviewersWithLanguages();
    sendSuccess(res, data, "Reviewers fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function getReviewerByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const user = await findUserById(id);
    if (!user || user.role !== "REVIEWER") {
      sendError(res, "Reviewer not found", 404);
      return;
    }

    const reviewer = await getReviewerWithLanguages(id);
    sendSuccess(res, reviewer, "Reviewer fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function assignLanguagesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    
    const user = await findUserById(id);
    if (!user) {
      sendError(res, "User not found", 404);
      return;
    }
    if (user.role !== "REVIEWER") {
      sendError(res, "User is not a reviewer", 400);
      return;
    }

    const parsed = assignLanguagesSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(", "), 400);
      return;
    }

    const { languageIds } = parsed.data;



    const validIds = await validateReviewerLanguageIds(languageIds);
    if (validIds.length !== languageIds.length) {
      sendError(res, "One or more language IDs are invalid or inactive", 400);
      return;
    }

    await assignLanguagesToReviewer(id, languageIds);
    const updated = await getReviewerWithLanguages(id);
    sendSuccess(res, updated, "Languages assigned to reviewer successfully");
  } catch (err) {
    next(err);
  }
}

export async function removeLanguagesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const user = await findUserById(id);
    if (!user || user.role !== "REVIEWER") {
      sendError(res, "Reviewer not found", 404);
      return;
    }

    const parsed = assignLanguagesSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(", "), 400);
      return;
    }

    await removeLanguagesFromReviewer(id, parsed.data.languageIds);
    const updated = await getReviewerWithLanguages(id);
    sendSuccess(res, updated, "Languages removed from reviewer successfully");
  } catch (err) {
    next(err);
  }
}