
import { Router } from "express";

import {
  createAssignmentController,
  getAllAssignmentsController,
  getMyTeamAssignmentsController,
  updateAssignmentStatusController
} from "./assignment.controller";

import {
  protect,
  authorizeRoles
} from "../../middlewares/auth.middleware";

import {
  uploadResolutionImages
} from "../../middlewares/upload.middleware";

const router = Router();


router.post(
  "/",
  protect,
  authorizeRoles("admin", "operator"),
  createAssignmentController
);


router.get(
  "/",
  protect,
  authorizeRoles("admin", "operator"),
  getAllAssignmentsController
);


router.get(
  "/my",
  protect,
  authorizeRoles("response_team"),
  getMyTeamAssignmentsController
);

router.patch(
  "/:id/status",
  protect,
  authorizeRoles("response_team"),
  uploadResolutionImages,
  updateAssignmentStatusController
);

export default router;
