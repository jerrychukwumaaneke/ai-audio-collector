import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { supabaseAdmin, supabaseClient } from "../config/supabase";
import { createUserProfile, findUserById } from "../services/user.service";
import { sendError, sendSuccess } from "../utils/response";

const signupSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters"),
  firstName: z
    .string({ required_error: "First name is required" })
    .min(1, "First name cannot be empty"),
  lastName: z
    .string({ required_error: "Last name is required" })
    .min(1, "Last name cannot be empty"),
  phone: z
    .string({ required_error: "Phone number is required" })
    .regex(
      /^\+?[0-9]{7,15}$/,
      "Phone must be a valid number (7–15 digits, optional leading + or 0)"
    ),
});

const signinSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password cannot be empty"),
});

export async function signup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(", ");
      sendError(res, message, 400);
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
    } catch (err) {
      console.error("Profile creation error:", err);
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
      const message = parsed.error.errors.map((e) => e.message).join(", ");
      sendError(res, message, 400);
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