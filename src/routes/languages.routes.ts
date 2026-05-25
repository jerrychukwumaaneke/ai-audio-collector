import { Router } from "express";
import { addLanguage, listLanguages, removeLanguage } from "../controllers/languages.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, authorize("ADMIN"), addLanguage);
router.get("/", authenticate, listLanguages);
router.delete("/:code", authenticate, authorize("ADMIN"), removeLanguage);

export default router;
