import { Router } from "express";
import { getPending, getOne, approve, correct } from "../controllers/review.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

// Must be logged in AND have REVIEWER or ADMIN role
router.use(authMiddleware);
router.use(requireRole(["REVIEWER", "ADMIN"]));

router.get("/pending", getPending);
router.get("/:id", getOne);
router.patch("/:id/approve", approve);
router.patch("/:id/correct", correct);

export default router;