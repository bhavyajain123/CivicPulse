import { Router } from "express";

import {
  register,
  login,
  getMe,
  migrateLegacyAccount
} from "./auth.controller";

import { authLimiter } from "../../middlewares/rate-limit.middleware";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

router.post(
  "/migrate-legacy",
  authLimiter,
  migrateLegacyAccount
);

router.get("/me", protect, getMe);

export default router;