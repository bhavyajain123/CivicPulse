
import { Router } from "express";
import { analyzeIncidentController, recommendTeamsController } from "./ai.controller";
import {
  protect,
  authorizeRoles
} from "../../middlewares/auth.middleware";
import { checkDuplicatesController, mlPredictController, mlDuplicatesController, mlModelInfoController } from "./ai.controller";

const router = Router();

router.post(
  "/analyze",
  protect,
  authorizeRoles("citizen", "operator", "officer", "admin"),
  analyzeIncidentController
);
router.post(
  "/recommend-teams",
  protect,
  authorizeRoles("citizen", "operator", "officer", "admin"),
  recommendTeamsController
);

router.post(
  "/check-duplicates",
  protect,
  authorizeRoles("citizen", "operator", "officer", "admin"),
  checkDuplicatesController
);

// Additional Python ML service endpoints. Existing Gemini endpoints remain unchanged.
router.get("/ml/model-info", protect, authorizeRoles("citizen", "operator", "officer", "admin"), mlModelInfoController);
router.post("/ml/predict", protect, authorizeRoles("citizen", "operator", "officer", "admin"), mlPredictController);
router.post("/ml/duplicates", protect, authorizeRoles("citizen", "operator", "officer", "admin"), mlDuplicatesController);

export default router;
