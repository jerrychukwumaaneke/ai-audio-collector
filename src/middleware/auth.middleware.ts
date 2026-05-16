import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../config/supabase.js";

export const authMiddleware = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Use Supabase to verify the token — NOT jwt.verify
    // The token is a Supabase JWT, not a custom one
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    req.user = { id: user.id };
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};