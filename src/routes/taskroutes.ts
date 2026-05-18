import { Router } from "express";
import {
  createTaskHandler,
  deleteTaskHandler,
  getAllTasksHandler,
  getTaskByIdHandler,
  updateTaskHandler,
} from "../controllers/taskcontroller";
import { authenticate } from "../middleware/authmiddleware";
import { requireRole } from "../middleware/rolemiddleware";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.post("/", createTaskHandler);
router.get("/", getAllTasksHandler);
router.get("/:id", getTaskByIdHandler);
router.patch("/:id", updateTaskHandler);
router.delete("/:id", deleteTaskHandler);

export default router;