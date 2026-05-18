import { Router } from "express";
import {
  deleteUserHandler,
  getAllUsersHandler,
  getUserByIdHandler,
  updateUserRoleHandler,
  updateUserStatusHandler,
} from "../controllers/user.controller";
import { authenticate } from "../middleware/authmiddleware";
import { requireRole } from "../middleware/rolemiddleware";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", getAllUsersHandler);
router.get("/:id", getUserByIdHandler);
router.patch("/:id/role", updateUserRoleHandler);
router.patch("/:id/status", updateUserStatusHandler);
router.delete("/:id", deleteUserHandler);

export default router;