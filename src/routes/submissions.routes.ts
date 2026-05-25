import { Router } from "express";
import {
  fetchSubmission,
  listSubmissions,
} from "../controllers/submissions.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/", listSubmissions);
router.get("/:id", fetchSubmission);

export default router;
