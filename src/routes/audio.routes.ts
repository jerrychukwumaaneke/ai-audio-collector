import { Router } from "express";
import { uploadAudio } from "../controllers/audio.controller.js";
import { uploadMiddleware } from "../middleware/upload.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Order is critical: 1. Auth -> 2. File Handling -> 3. Controller
router.post("/upload", authMiddleware, uploadMiddleware, uploadAudio);

export default router;