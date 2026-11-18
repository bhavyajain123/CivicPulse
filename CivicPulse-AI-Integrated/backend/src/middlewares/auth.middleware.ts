import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import { firebaseAdminAuth } from "../config/firebase-admin";
import {
  findOrLinkFirebaseUser
} from "../modules/auth/firebase-user.service";

import User from "../modules/users/user.model";
import type { AuthRequest } from "../types/auth.types";

export type { AuthRequest } from "../types/auth.types";

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Please login first"
      });
      return;
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Invalid token"
      });
      return;
    }

    let firebaseDecoded;

    try {
      firebaseDecoded =
        await firebaseAdminAuth.verifyIdToken(token);
    } catch {
      firebaseDecoded = undefined;
    }

    if (firebaseDecoded) {
      try {
        const user = await findOrLinkFirebaseUser(
          firebaseDecoded
        );

        if (!user) {
          res.status(403).json({
            success: false,
            message: "No CivicPulse account found. Please complete registration."
          });
          return;
        }

        req.user = {
          userId: user._id.toString(),
          role: user.role
        };

        next();
        return;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "";

        const status =
          message === "ACCOUNT_INACTIVE" ||
          message === "VERIFIED_EMAIL_REQUIRED" ||
          message === "ACCOUNT_ALREADY_LINKED"
            ? 403
            : 500;

        res.status(status).json({
          success: false,
          message: message === "ACCOUNT_INACTIVE"
            ? "Your account is inactive"
            : message === "VERIFIED_EMAIL_REQUIRED"
              ? "Please verify your Firebase email first"
              : message === "ACCOUNT_ALREADY_LINKED"
                ? "This account is linked to another Firebase user"
                : "Authentication failed"
        });

        return;
      }
    }

   
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      res.status(500).json({
        success: false,
        message: "Authentication configuration error"
      });
      return;
    }

    const decoded = jwt.verify(token, secret);

    if (
      typeof decoded === "string" ||
      typeof decoded.userId !== "string" ||
      !mongoose.isValidObjectId(decoded.userId)
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid token payload"
      });
      return;
    }

    const user = await User.findById(decoded.userId)
      .select("_id role isActive");

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: "Account not found or inactive"
      });
      return;
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role
    };

    next();

  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Please login first"
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "You are not allowed to perform this action"
      });
      return;
    }

    next();
  };
};