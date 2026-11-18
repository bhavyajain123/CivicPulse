import type { Socket } from "socket.io";
import jwt from "jsonwebtoken";

import { firebaseAdminAuth } from "../config/firebase-admin";
import {
  findOrLinkFirebaseUser
} from "../modules/auth/firebase-user.service";

import User from "../modules/users/user.model";
import type { AuthUser, UserRole } from "./types";

export const authenticateSocket = async (
  socket: Socket,
  next: (error?: Error) => void
): Promise<void> => {
  try {
    const authToken = socket.handshake.auth?.token;

    const authorizationHeader =
      socket.handshake.headers.authorization;

    const bearerToken =
      typeof authorizationHeader === "string"
        ? authorizationHeader.replace(/^Bearer\s+/i, "")
        : undefined;

    const token = authToken || bearerToken;

    if (!token || typeof token !== "string") {
      return next(new Error("Authentication required"));
    }

  
    let firebaseDecoded;

    try {
      firebaseDecoded =
        await firebaseAdminAuth.verifyIdToken(token);
    } catch {
      firebaseDecoded = undefined;
    }

    if (firebaseDecoded) {
      const user = await findOrLinkFirebaseUser(
        firebaseDecoded
      );

      if (!user) {
        return next(
          new Error("CivicPulse account not found")
        );
      }

      const authenticatedUser: AuthUser = {
        userId: user._id.toString(),
        role: user.role as UserRole
      };

      socket.data.user = authenticatedUser;
      socket.data.connectedAt = Date.now();

      return next();
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is missing");
      return next(
        new Error("Socket authentication unavailable")
      );
    }

    const decoded = jwt.verify(token, secret) as {
      userId?: string;
      role?: string;
    };

    if (!decoded.userId) {
      return next(new Error("Invalid token payload"));
    }

    const user = await User.findById(decoded.userId)
      .select("_id role isActive");

    if (!user || !user.isActive) {
      return next(
        new Error("Account inactive or not found")
      );
    }

    const authenticatedUser: AuthUser = {
      userId: user._id.toString(),
      role: user.role as UserRole
    };

    socket.data.user = authenticatedUser;
    socket.data.connectedAt = Date.now();

    return next();

  } catch (error) {
    console.error("Socket authentication failed:", error);

    return next(
      new Error("Invalid or expired token")
    );
  }
};