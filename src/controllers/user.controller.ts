import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../config/supabase";
import {
  deleteUser,
  findUserById,
  getAllUsers,
  updateUserRole,
  updateUserStatus,
} from "../services/user.service";
import { sendError, sendSuccess } from "../utils/response";


const roleSchema = z.object({
  role: z.enum(["ADMIN", "USER", "REVIEWER"], {
    required_error: "Role is required",
  }),
});


const statusSchema = z.object({
  status: z.enum(["ACTIVE", "OFFLINE"], {
    required_error: "Status is required",
  }),
});


const querySchema = z.object({
  role: z.enum(["ADMIN", "USER", "REVIEWER"]).optional(),
  status: z.enum(["ACTIVE", "OFFLINE"]).optional(),
  search: z.string().optional(),
});



export async function getAllUsersHandler(
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

    const data = await getAllUsers(parsed.data);
    sendSuccess(res, data, "Users fetched successfully");
  } catch (err) {
    next(err);
  }
}



export async function getUserByIdHandler(
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



export async function updateUserRoleHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    // prevent admin from changing their own role
    if (id === req.user!.id) {
      sendError(res, "You cannot change your own role", 400);
      return;
    }

    const parsed = roleSchema.safeParse(req.body);
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




export async function updateUserStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    // prevent admin from suspending themselves
    if (id === req.user!.id) {
      sendError(res, "You cannot change your own status", 400);
      return;
    }

    const parsed = statusSchema.safeParse(req.body);
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

export async function deleteUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    // prevent admin from deleting themselves
    if (id === req.user!.id) {
      sendError(res, "You cannot delete your own account", 400);
      return;
    }

    const user = await findUserById(id);
    if (!user) {
      sendError(res, "User not found", 404);
      return;
    }

    // delete from Supabase auth first, then our users table
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) {
      sendError(res, "Failed to delete user from auth", 500);
      return;
    }

    await deleteUser(id);
    sendSuccess(res, null, "User deleted successfully");
  } catch (err) {
    next(err);
  }
}