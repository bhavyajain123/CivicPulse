import { Router } from "express";
import {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintById,
  updateComplaint,
  assignComplaintController,
  getAssignedComplaintsController,
  updateAssignedComplaintController
} from "./complaint.controller";
import { protect, authorizeRoles } from "../../middlewares/auth.middleware";

const router = Router();

router.use(protect);
router.post("/", createComplaint);
router.get("/my", getMyComplaints);

router.get(
  "/",
  authorizeRoles("admin", "operator"),
  getAllComplaints
);

router.patch(
  "/:id/assign",
  authorizeRoles("admin", "operator"),
  assignComplaintController
);
router.get(
  "/assigned",
  authorizeRoles("response_team"),
  getAssignedComplaintsController
);
router.patch(
  "/:id/assigned-status",
  authorizeRoles("response_team"),
  updateAssignedComplaintController
);

router.get("/:id", getComplaintById);

router.patch(
  "/:id",
  authorizeRoles("admin", "operator"),
  updateComplaint
);

export default router;