import { NextFunction, Request, Response } from "express";
import { updateUserProfile } from "../services/user.service";
import { sendError, sendSuccess } from "../utils/response";
import { updateProfileSchema } from "../validators/users.validators";

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    sendSuccess(res, req.user!, "Profile retrieved successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(", "), 400);
      return;
    }

    if (Object.keys(parsed.data).length === 0) {
      sendError(res, "No fields provided to update", 400);
      return;
    }

    const updated = await updateUserProfile(req.user!.id, parsed.data);
    sendSuccess(res, updated, "Profile updated successfully");
  } catch (err) {
    next(err);
  }
}
