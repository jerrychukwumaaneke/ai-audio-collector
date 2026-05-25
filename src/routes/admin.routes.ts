import { Router } from "express";
import {
  changeRole,
  changeStatus,
  getUserById,
  listUsers,
} from "../controllers/admin.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/", listUsers);
router.get("/:id", getUserById);
router.patch("/:id/role", changeRole);
router.patch("/:id/status", changeStatus);

export default router;
