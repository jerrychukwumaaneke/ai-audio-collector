import { Router } from "express";
import {
  addTask,
  editTask,
  fetchTask,
  listTasks,
  removeTask,
} from "../controllers/tasks.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, authorize("ADMIN"), addTask);
router.get("/", authenticate, listTasks);
router.get("/:id", authenticate, fetchTask);
router.patch("/:id", authenticate, authorize("ADMIN"), editTask);
router.delete("/:id", authenticate, authorize("ADMIN"), removeTask);

export default router;
