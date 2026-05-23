import { Router } from "express";
import {
  createTaskHandler,
  deleteTaskHandler,
  getAllTasksHandler,
  getTaskByIdHandler,
  updateTaskHandler,
} from "../controllers/taskcontroller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.post("/", createTaskHandler);
router.get("/", getAllTasksHandler);
router.get("/:id", getTaskByIdHandler);
router.patch("/:id", updateTaskHandler);
router.delete("/:id", deleteTaskHandler);

export default router;