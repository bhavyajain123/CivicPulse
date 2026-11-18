
import { Router } from "express";

import {
  createFeedbackController,
  getMyFeedbackController,
  getAllFeedbackController,
  updateFeedbackStatusController
} from "./feedback.controller";

import {
  protect,
  authorizeRoles
} from "../../middlewares/auth.middleware";

const router = Router();

router.post(
  "/",
  protect,
  authorizeRoles("citizen"),
  createFeedbackController
);

router.get(
  "/my",
  protect,
  authorizeRoles("citizen"),
  getMyFeedbackController
);

router.get(
  "/",
  protect,
  authorizeRoles("admin", "operator"),
  getAllFeedbackController
);

router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin", "operator"),
  updateFeedbackStatusController
);

export default router;
