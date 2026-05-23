import { Router } from "express";
import {
  createLanguageHandler,
  deleteLanguageHandler,
  getAllLanguagesHandler,
  updateLanguageHandler,
} from "../controllers/langcontroller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.post("/", createLanguageHandler);
router.get("/", getAllLanguagesHandler);
router.patch("/:id", updateLanguageHandler);
router.delete("/:id", deleteLanguageHandler);

export default router;