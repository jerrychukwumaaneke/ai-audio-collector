import { NextFunction, Request, Response } from "express";
import { createLanguageSchema } from "../validators/languages.validators";
import {
  createLanguage,
  getAllLanguages,
  getLanguageByCode,
  deleteLanguage,
} from "../services/languages.service";
import { sendError, sendSuccess } from "../utils/response";

export async function addLanguage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createLanguageSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(", "), 400);
      return;
    }
    const language = await createLanguage(parsed.data);
    sendSuccess(res, language, "Language created successfully", 201);
  } catch (err) {
    next(err);
  }
}

export async function listLanguages(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await getAllLanguages();
    sendSuccess(res, data, "Languages fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function removeLanguage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { code } = req.params;
    const language = await getLanguageByCode(code);
    if (!language) {
      sendError(res, "Language not found", 404);
      return;
    }
    await deleteLanguage(code);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
