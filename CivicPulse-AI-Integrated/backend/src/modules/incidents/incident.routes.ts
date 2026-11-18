
import { Router } from "express";

import {
  createIncidentController,
  getMyIncidentsController,
  getAllIncidentsController,
  updateIncidentStatusController,
  assignIncidentController,
  getIncidentTimelineController,
  getAssignedIncidentsController,
  startAssignedIncidentController,
  resolveAssignedIncidentController,
  addResolutionPhotosController
} from "./incident.controller";

import {
  protect,
  authorizeRoles
} from "../../middlewares/auth.middleware";

import { uploadIncidentImages, uploadResolutionImages } from "../../middlewares/upload.middleware";

const router = Router();


router.post(
  "/",
  protect,
  uploadIncidentImages,
  createIncidentController
);

router.get("/my-incidents", protect, getMyIncidentsController);
router.get("/", protect, authorizeRoles("admin","operator"), getAllIncidentsController);
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("operator", "admin"),
  updateIncidentStatusController
);

router.patch(
  "/:id/assign",
  protect,
  authorizeRoles("operator", "admin"),
  assignIncidentController
);

router.get(
  "/assigned",
  protect,
  authorizeRoles("response_team"),
  getAssignedIncidentsController
);

router.patch(
  "/:id/start",
  protect,
  authorizeRoles("response_team"),
  startAssignedIncidentController
);

router.patch(
  "/:id/resolve",
  protect,
  authorizeRoles("response_team"),
  resolveAssignedIncidentController
);
router.post(
  "/:id/resolution-photos",
  protect,
  authorizeRoles("response_team"),
  uploadResolutionImages,
  addResolutionPhotosController
);

router.get("/:id/timeline", protect, getIncidentTimelineController);
export default router;
