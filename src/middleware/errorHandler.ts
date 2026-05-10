import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";
import { sendError } from "../utils/response";

interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  logger.error(`${statusCode} - ${err.message}`, err.stack);
  sendError(res, err.message || "Internal Server Error", statusCode);
}
