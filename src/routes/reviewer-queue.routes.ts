import { Router } from "express";
import {
  getQueueSubmissionByIdHandler,
  getReviewerHistoryHandler,
  getReviewerQueueHandler,
  getReviewerStatsHandler,
  reviewSubmissionHandler,
} from "../controllers/reviewer-queue.controller";
import { authenticate } from "../middleware/authmiddleware";
import { requireRole } from "../middleware/rolemiddleware";

const router = Router();

router.use(authenticate, requireRole("REVIEWER"));

router.get("/", getReviewerQueueHandler);
router.get("/:id", getQueueSubmissionByIdHandler);
router.post("/:id/review", reviewSubmissionHandler); 


router.get("/history", getReviewerHistoryHandler);
router.get("/stats", getReviewerStatsHandler);

export default router;