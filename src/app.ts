import cors from "cors";
import express, { Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import userRoutes from "./routes/user.routes";
import languageRoutes from "./routes/langroutes";
import taskRoutes from "./routes/taskroutes";
import reviewerRoutes from "./routes/reviewer.routes";
import submissionRoutes from "./routes/submissions.routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin/users", adminRoutes);
app.use("/api/admin/languages", languageRoutes);
app.use("/api/admin/tasks", taskRoutes);
app.use("/api/admin/reviewers", reviewerRoutes);
app.use("/api/admin/submissions", submissionRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
