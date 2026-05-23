import { Router } from "express";
import {
  getAllSubmissionsHandler,
  getSubmissionByIdHandler,
} from "../controllers/submissions.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/", getAllSubmissionsHandler);
router.get("/:id", getSubmissionByIdHandler);

export default router;