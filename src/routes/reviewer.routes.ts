import { Router } from "express";
import {
  assignLanguagesHandler,
  getAllReviewersHandler,
  getReviewerByIdHandler,
  removeLanguagesHandler,
} from "../controllers/reviewer.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/", getAllReviewersHandler);
router.get("/:id", getReviewerByIdHandler);
router.post("/:id/languages", assignLanguagesHandler);
router.delete("/:id/languages", removeLanguagesHandler);

export default router;