
import { Router } from "express";
import {
  createTeamController,
  getAllTeamsController,
  getTeamByIdController,
  updateTeamController,
  deleteTeamController,
  addTeamMemberController,
  removeTeamMemberController
} from "./team.controller";

import {
  protect,
  authorizeRoles
} from "../../middlewares/auth.middleware";

import asyncHandler from "../../utils/asyncHandler";

const router = Router();

router.use(protect);


router.post(
  "/",
  authorizeRoles("admin", "operator"),
  asyncHandler(createTeamController)
);

router.get(
  "/",
  authorizeRoles("admin", "operator"),
  asyncHandler(getAllTeamsController)
);

router.get(
  "/:id",
  authorizeRoles("admin", "operator"),
  asyncHandler(getTeamByIdController)
);

router.patch(
  "/:id",
  authorizeRoles("admin", "operator"),
  asyncHandler(updateTeamController)
);

router.delete(
  "/:id",
  authorizeRoles("admin"),
  asyncHandler(deleteTeamController)
);

router.post(
  "/:id/members",
  authorizeRoles("admin", "operator"),
  asyncHandler(addTeamMemberController)
);

router.delete(
  "/:id/members",
  authorizeRoles("admin"),
  asyncHandler(removeTeamMemberController)
);

export default router;
