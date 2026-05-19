import cors from "cors";
import express, { Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import authRoutes from "./routes/authroutes";
import languageRoutes from "./routes/langroutes";
import taskRoutes from "./routes/taskroutes";
import userRoutes from "./routes/user.routes";
import reviewerRoutes from "./routes/reviewer.routes";
import submissionRoutes from "./routes/submissions.routes";
import reviewerQueueRoutes from "./routes/reviewer-queue.routes";



const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());


app.use("/api/admin/languages", languageRoutes);
app.use("/api/admin/tasks", taskRoutes);
app.use("/api/admin/users", userRoutes);

app.use("/api/admin/reviewers", reviewerRoutes);
app.use("/api/admin/submissions", submissionRoutes);

app.use("/api/reviewer/queue", reviewerQueueRoutes);
app.use("/api/reviewer", reviewerQueueRoutes);


app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.use("/api/auth", authRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
