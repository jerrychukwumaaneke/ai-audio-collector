import { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/response";

export function notFound(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404);
}
