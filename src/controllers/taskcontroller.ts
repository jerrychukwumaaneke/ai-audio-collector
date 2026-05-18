import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  createTask,
  deleteTask,
  findTaskById,
  getAllTasks,
  updateTask,
} from "../services/taskservice";
import { sendError, sendSuccess } from "../utils/response";

const createTaskSchema = z.object({
  text: z.string({ required_error: "Task text is required" }).min(1).trim(),
  languageIds: z
    .array(z.string().uuid("Invalid language ID"))
    .min(1, "At least one language is required"),
});

const updateTaskSchema = z.object({
  text: z.string().min(1).trim().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  languageIds: z.array(z.string().uuid("Invalid language ID")).min(1).optional(),
});



export async function createTaskHandler(
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

    const { text } = parsed.data;

    const task = await createTask({ text, createdBy: req.user!.id });
    const full = await findTaskById(task.id);
    sendSuccess(res, full, "Task created successfully", 201);
  } catch (err) {
    next(err);
  }
}


export async function getAllTasksHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await getAllTasks();
    sendSuccess(res, data, "Tasks fetched successfully");
  } catch (err) {
    next(err);
  }
}



export async function getTaskByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const task = await findTaskById(req.params.id);
    if (!task) {
      sendError(res, "Task not found", 404);
      return;
    }
    sendSuccess(res, task, "Task fetched successfully");
  } catch (err) {
    next(err);
  }
}



export async function updateTaskHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(", "), 400);
      return;
    }

    const task = await findTaskById(id);
    if (!task) {
      sendError(res, "Task not found", 404);
      return;
    }

    const updated = await updateTask(id, parsed.data);
    const full = await findTaskById(updated!.id);
    sendSuccess(res, full, "Task updated successfully");
  } catch (err) {
    next(err);
  }
}



export async function deleteTaskHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const task = await findTaskById(id);
    if (!task) {
      sendError(res, "Task not found", 404);
      return;
    }

    await deleteTask(id);
    sendSuccess(res, null, "Task deleted successfully");
  } catch (err) {
    next(err);
  }
}