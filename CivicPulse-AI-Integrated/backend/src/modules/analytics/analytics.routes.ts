
import { Router } from "express";

import {
  getDashboardStatisticsController,
  getIncidentOverviewController,
  getPriorityStatisticsController,
  getCategoryStatisticsController,
  getMonthlyStatisticsController,
  getTeamStatisticsController,
  getDepartmentStatisticsController
} from "./analytics.controller";

import {
  protect,
  authorizeRoles
} from "../../middlewares/auth.middleware";

const router = Router();

router.use(protect, authorizeRoles("admin", "operator"));
router.get("/dashboard", getDashboardStatisticsController);
router.get("/overview", getIncidentOverviewController);
router.get("/priority", getPriorityStatisticsController);
router.get("/category", getCategoryStatisticsController);
router.get("/monthly", getMonthlyStatisticsController);
router.get("/teams", getTeamStatisticsController);
router.get("/departments", getDepartmentStatisticsController);

export default router;
