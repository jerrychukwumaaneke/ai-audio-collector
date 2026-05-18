import { Router } from "express";
import {
  getAllSubmissionsHandler,
  getSubmissionByIdHandler,
} from "../controllers/submissions.controller";
import { authenticate } from "../middleware/authmiddleware";
import { requireRole } from "../middleware/rolemiddleware";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", getAllSubmissionsHandler);
router.get("/:id", getSubmissionByIdHandler);

export default router;