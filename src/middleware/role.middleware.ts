import { Response, NextFunction } from "express";
import { findUserById } from "../services/user.service.js";

// Usage: router.use(requireRole(["REVIEWER", "ADMIN"]))
export const requireRole = (roles: string[]) => {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await findUserById(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({
          message: `Access denied. Required role: ${roles.join(" or ")}`,
        });
      }

      // Attach full user to request for use in controllers
      req.userProfile = user;
      next();
    } catch (error) {
      return res.status(500).json({ message: "Role check failed" });
    }
  };
};