import { NextFunction, Request, Response } from "express";
import { supabaseAdmin, supabaseClient } from "../config/supabase";
import { createUserProfile, findUserById } from "../services/user.service";
import { sendError, sendSuccess } from "../utils/response";
import { signinSchema, signupSchema } from "../validators/auth.validators";

export async function signup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(", "), 400);
      return;
    }

    const { email, password, firstName, lastName, phone } = parsed.data;

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      sendError(res, authError?.message ?? "Failed to create account", 400);
      return;
    }

    let profile;
    try {
      profile = await createUserProfile({
        id: authData.user.id,
        email,
        firstName,
        lastName,
        phone,
      });
    } catch {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      sendError(res, "Failed to create user profile", 500);
      return;
    }

    sendSuccess(res, profile, "Account created successfully", 201);
  } catch (err) {
    next(err);
  }
}

export async function signin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = signinSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(", "), 400);
      return;
    }

    const { email, password } = parsed.data;

    const { data: authData, error: authError } =
      await supabaseClient.auth.signInWithPassword({ email, password });

    if (authError || !authData.user || !authData.session) {
      sendError(res, "Invalid email or password", 401);
      return;
    }

    const profile = await findUserById(authData.user.id);
    if (!profile) {
      sendError(res, "User profile not found", 404);
      return;
    }

    sendSuccess(
      res,
      {
        user: profile,
        session: {
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          expiresAt: authData.session.expires_at,
        },
      },
      "Signed in successfully"
    );
  } catch (err) {
    next(err);
  }
}
