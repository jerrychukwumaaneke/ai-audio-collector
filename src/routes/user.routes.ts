import { Router } from "express";
import { getMe, updateMe } from "../controllers/users.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/me", getMe);
router.patch("/me", updateMe);

export default router;