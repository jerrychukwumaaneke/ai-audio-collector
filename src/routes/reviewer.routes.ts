import { Router } from "express";
import {
  assignLanguagesHandler,
  getAllReviewersHandler,
  getReviewerByIdHandler,
  removeLanguagesHandler,
} from "../controllers/reviewer.controller";
import { authenticate } from "../middleware/authmiddleware";
import { requireRole } from "../middleware/rolemiddleware";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", getAllReviewersHandler);
router.get("/:id", getReviewerByIdHandler);
router.post("/:id/languages", assignLanguagesHandler);
router.delete("/:id/languages", removeLanguagesHandler);

export default router;