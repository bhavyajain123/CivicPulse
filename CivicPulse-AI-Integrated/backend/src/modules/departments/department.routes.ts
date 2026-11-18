
import { Router } from "express";

import {
  createDepartmentController,
  getAllDepartmentsController,
  getDepartmentByIdController,
  updateDepartmentController,
  deleteDepartmentController
} from "./department.controller";

import {
  protect,
  authorizeRoles
} from "../../middlewares/auth.middleware";

const router = Router();

router.get(
  "/",
  protect,
  authorizeRoles("admin", "operator"),
  getAllDepartmentsController
);


router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  createDepartmentController
);


router.get(
  "/:id",
  protect,
  authorizeRoles("admin", "operator"),
  getDepartmentByIdController
);


router.patch(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateDepartmentController
);


router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteDepartmentController
);

export default router;
