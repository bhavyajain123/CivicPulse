
import { Router } from "express";

import {
  getNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController
} from "./notification.controller";

import { protect } from "../../middlewares/auth.middleware";

const router = Router();

router.use(protect);

router.get("/", getNotificationsController);

router.patch(
  "/read-all",
  markAllNotificationsReadController
);

router.patch(
  "/:id/read",
  markNotificationReadController
);

export default router;
