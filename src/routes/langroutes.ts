import { Router } from "express";
import {
  createLanguageHandler,
  deleteLanguageHandler,
  getAllLanguagesHandler,
  updateLanguageHandler,
} from "../controllers/langcontroller";
import { authenticate } from "../middleware/authmiddleware";
import { requireRole } from "../middleware/rolemiddleware";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.post("/", createLanguageHandler);
router.get("/", getAllLanguagesHandler);
router.patch("/:id", updateLanguageHandler);
router.delete("/:id", deleteLanguageHandler);

export default router;