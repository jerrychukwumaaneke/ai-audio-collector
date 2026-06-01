import { Router } from "express";
import {
  confirm,
  fetchSubmission,
  listSubmissions,
  prepare,
  removeSubmission,
} from "../controllers/submissions.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.post("/prepare", authenticate, authorize("USER"), prepare);
router.post("/:id/confirm", authenticate, authorize("USER"), confirm);
router.get("/", authenticate, listSubmissions);
router.get("/:id", authenticate, fetchSubmission);
router.delete("/:id", authenticate, removeSubmission);

export default router;
