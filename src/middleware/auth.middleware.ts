import { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { findUserById } from "../services/user.service";
import { Role } from "../types";
import { sendError } from "../utils/response";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      sendError(res, "Missing or invalid authorization header", 401);
      return;
    }

    const token = authHeader.split(" ")[1];

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      sendError(res, "Invalid or expired token", 401);
      return;
    }

    const profile = await findUserById(data.user.id);
    if (!profile) {
      sendError(res, "User profile not found", 404);
      return;
    }

    if (profile.status === "OFFLINE") {
      sendError(res, "Account is suspended", 403);
      return;
    }

    req.user = profile;
    next();
  } catch (err) {
    next(err);
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    if (!roles.includes(req.user.role as Role)) {
      sendError(res, `Access denied. Required role: ${roles.join(" or ")}`, 403);
      return;
    }

    next();
  };
}
