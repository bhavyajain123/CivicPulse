
import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors";
import helmet from "helmet";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/user.routes";
import incidentRoutes from "./modules/incidents/incident.routes";
import teamRoutes from "./modules/response-teams/team.routes";
import departmentRoutes from "./modules/departments/department.routes";
import notificationRoutes from "./modules/notifications/notification.routes";
import assignmentRoutes from "./modules/assignments/assignment.routes";
import feedbackRoutes from "./modules/feedback/feedback.routes";
import aiRoutes from "./modules/ai/ai.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import supportRoutes from "./modules/support/support.routes";
import { handleUploadError } from "./middlewares/upload.middleware";
import errorMiddleware from "./middlewares/error.middleware";
import { apiLimiter } from "./middlewares/rate-limit.middleware";
import complaintRoutes from "./modules/complaints/complaint.routes";

const app = express();

app.use(helmet());

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/users", apiLimiter, userRoutes);
app.use("/api/v1/incidents", apiLimiter, incidentRoutes);
app.use("/api/v1/teams", apiLimiter, teamRoutes);
app.use("/api/v1/departments", apiLimiter, departmentRoutes);
app.use("/api/v1/notifications", apiLimiter, notificationRoutes);
app.use("/api/v1/assignments", apiLimiter, assignmentRoutes);
app.use("/api/v1/feedback", apiLimiter, feedbackRoutes);
app.use("/api/v1/complaints", apiLimiter, complaintRoutes);
app.use("/api/v1/ai", apiLimiter, aiRoutes);
app.use("/api/v1/analytics", apiLimiter, analyticsRoutes);
app.use("/api/v1/support", apiLimiter, supportRoutes);


app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CivicPulse API is running"
  });
});

app.use(handleUploadError);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});


app.use(errorMiddleware);

export default app;
