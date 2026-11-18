import { Router } from "express";

import {
  createSupportRequestController,
  getAllSupportRequestsController,
  getSupportRequestByIdController,
  updateSupportRequestStatusController
} from "./support.controller";

import {
  protect,
  authorizeRoles
} from "../../middlewares/auth.middleware";

const router = Router();


router.use(protect);
router.use(authorizeRoles("admin", "operator"));


router.post("/", createSupportRequestController);


router.get("/", getAllSupportRequestsController);
router.get("/:id", getSupportRequestByIdController);

router.patch("/:id/status", updateSupportRequestStatusController);

export default router;