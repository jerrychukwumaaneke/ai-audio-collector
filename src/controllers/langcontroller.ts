import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  createLanguage,
  deleteLanguage,
  findLanguageByCode,
  findLanguageById,
  findLanguageByName,
  getAllLanguages,
  updateLanguage,
} from "../services/langservice";
import { sendError, sendSuccess } from "../utils/response";

const createLanguageSchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(1).trim(),
  code: z.string({ required_error: "Code is required" }).min(2).max(10).trim().toLowerCase(),
});

const updateLanguageSchema = z.object({
  name: z.string().min(1).trim().optional(),
  code: z.string().min(2).max(10).trim().toLowerCase().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export async function createLanguageHandler(
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

    const { name, code } = parsed.data;

    const [existingName, existingCode] = await Promise.all([
      findLanguageByName(name),
      findLanguageByCode(code),
    ]);

    if (existingName) {
      sendError(res, "A language with this name already exists", 409);
      return;
    }

    if (existingCode) {
      sendError(res, "A language with this code already exists", 409);
      return;
    }

    const language = await createLanguage({ name, code });
    sendSuccess(res, language, "Language created successfully", 201);
  } catch (err) {
    next(err);
  }
}

export async function getAllLanguagesHandler(
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

export async function updateLanguageHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const parsed = updateLanguageSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(", "), 400);
      return;
    }

    const language = await findLanguageById(id);
    if (!language) {
      sendError(res, "Language not found", 404);
      return;
    }

    if (parsed.data.name && parsed.data.name !== language.name) {
      const existing = await findLanguageByName(parsed.data.name);
      if (existing) {
        sendError(res, "A language with this name already exists", 409);
        return;
      }
    }

    if (parsed.data.code && parsed.data.code !== language.code) {
      const existing = await findLanguageByCode(parsed.data.code);
      if (existing) {
        sendError(res, "A language with this code already exists", 409);
        return;
      }
    }

    const updated = await updateLanguage(id, parsed.data);
    sendSuccess(res, updated, "Language updated successfully");
  } catch (err) {
    next(err);
  }
}

export async function deleteLanguageHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const language = await findLanguageById(id);
    if (!language) {
      sendError(res, "Language not found", 404);
      return;
    }

    await deleteLanguage(id);
    sendSuccess(res, null, "Language deleted successfully");
  } catch (err) {
    next(err);
  }
}