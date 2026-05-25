import { NextFunction, Request, Response } from "express";
import {
  findUserById,
  getAllUsers,
  updateUserRole,
  updateUserStatus,
} from "../services/user.service";
import { sendError, sendSuccess } from "../utils/response";
import {
  listUsersQuerySchema,
  updateRoleSchema,
  updateStatusSchema,
} from "../validators/admin.validators";

export async function listUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = listUsersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(", "), 400);
      return;
    }

    const result = await getAllUsers(parsed.data);
    sendSuccess(res, result, "Users fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await findUserById(req.params.id);
    if (!user) {
      sendError(res, "User not found", 404);
      return;
    }
    sendSuccess(res, user, "User fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function changeRole(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (id === req.user!.id) {
      sendError(res, "You cannot change your own role", 400);
      return;
    }

    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(", "), 400);
      return;
    }

    const user = await findUserById(id);
    if (!user) {
      sendError(res, "User not found", 404);
      return;
    }

    const updated = await updateUserRole(id, parsed.data.role);
    sendSuccess(res, updated, "User role updated successfully");
  } catch (err) {
    next(err);
  }
}

export async function changeStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (id === req.user!.id) {
      sendError(res, "You cannot change your own status", 400);
      return;
    }

    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(", "), 400);
      return;
    }

    const user = await findUserById(id);
    if (!user) {
      sendError(res, "User not found", 404);
      return;
    }

    const updated = await updateUserStatus(id, parsed.data.status);
    sendSuccess(res, updated, "User status updated successfully");
  } catch (err) {
    next(err);
  }
}
