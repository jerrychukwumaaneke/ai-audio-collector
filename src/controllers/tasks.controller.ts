import { NextFunction, Request, Response } from "express";
import { createTaskSchema, updateTaskSchema } from "../validators/tasks.validators";
import {
  createTask,
  deleteTask,
  getAllTasks,
  getTaskById,
  updateTask,
} from "../services/tasks.service";
import { sendError, sendSuccess } from "../utils/response";

export async function addTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(", "), 400);
      return;
    }
    const task = await createTask({ ...parsed.data, createdBy: req.user!.id });
    sendSuccess(res, task, "Task created successfully", 201);
  } catch (err) {
    next(err);
  }
}

export async function listTasks(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { type, languageCode } = req.query as {
      type?: string;
      languageCode?: string;
    };

    const validTypes = ["READ_SPEECH", "SPONTANEOUS_SPEECH"] as const;
    if (type && !validTypes.includes(type as (typeof validTypes)[number])) {
      sendError(res, "Type must be READ_SPEECH or SPONTANEOUS_SPEECH", 400);
      return;
    }

    const tasks = await getAllTasks({
      type: type as "READ_SPEECH" | "SPONTANEOUS_SPEECH" | undefined,
      languageCode,
    });
    sendSuccess(res, tasks, "Tasks fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function fetchTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const task = await getTaskById(req.params.id);
    if (!task) {
      sendError(res, "Task not found", 404);
      return;
    }
    sendSuccess(res, task, "Task fetched successfully");
  } catch (err) {
    next(err);
  }
}

export async function editTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(", "), 400);
      return;
    }
    const task = await updateTask(req.params.id, parsed.data);
    if (!task) {
      sendError(res, "Task not found", 404);
      return;
    }
    sendSuccess(res, task, "Task updated successfully");
  } catch (err) {
    next(err);
  }
}

export async function removeTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const task = await getTaskById(req.params.id);
    if (!task) {
      sendError(res, "Task not found", 404);
      return;
    }
    await deleteTask(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
