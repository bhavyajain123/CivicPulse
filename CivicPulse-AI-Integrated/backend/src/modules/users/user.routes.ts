
import { Router } from "express";

import {
  getProfile,
  getAllUsersController,
  getUserByIdController,
  updateProfileController,
  updateUserRoleController,
  updateUserStatusController,
  resetUserPasswordController,
  createUserController
} from "./user.controller";

import {
  protect,
  authorizeRoles
} from "../../middlewares/auth.middleware";

import asyncHandler from "../../utils/asyncHandler";

const router = Router();


router.get(
  "/profile",
  protect,
  asyncHandler(getProfile)
);

router.patch(
  "/profile",
  protect,
  asyncHandler(updateProfileController)
);

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  asyncHandler(createUserController)
);


router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  asyncHandler(getAllUsersController)
);

router.get(
  "/:id",
  protect,
  authorizeRoles("admin"),
  asyncHandler(getUserByIdController)
);

router.patch(
  "/:id/role",
  protect,
  authorizeRoles("admin"),
  asyncHandler(updateUserRoleController)
);

router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin"),
  asyncHandler(updateUserStatusController)
);
router.patch(
  "/:id/password",
  protect,
  authorizeRoles("admin"),
  asyncHandler(resetUserPasswordController)
);
export default router;
