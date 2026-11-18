import {Request, Response} from "express";
import { registerSchema, loginSchema, migrateLegacySchema } from "./auth.validation";

import type { AuthRequest } from "../../middlewares/auth.middleware";
import User from "../users/user.model";

import { registerUser, loginUser, migrateLegacyUserToFirebase } from "./auth.service";

import { firebaseAdminAuth } from "../../config/firebase-admin";

import {
  registerFirebaseUser
} from "./auth.service";

import {
  firebaseRegisterSchema
} from "./auth.validation";

export const register = async (req: Request, res: Response) => {
  try {
    const result = firebaseRegisterSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0].message
      });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Firebase authentication required"
      });
    }

    const token = authHeader.slice(7).trim();

    const decoded = await firebaseAdminAuth.verifyIdToken(token);

    const tokenEmail = decoded.email?.trim().toLowerCase();
    const requestEmail = result.data.email.trim().toLowerCase();

    if (!tokenEmail || tokenEmail !== requestEmail) {
      return res.status(403).json({
        success: false,
        message: "Firebase email does not match registration email"
      });
    }

    const user = await registerFirebaseUser(
      result.data,
      decoded.uid
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user
    });

  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Registration failed";

    const status = message.includes("already registered") ||
      message.includes("Email is already registered")
        ? 409
        : 500;

    return res.status(status).json({
      success: false,
      message: status === 500
        ? "Registration failed"
        : message
    });
  }
};
export const login= async(req:Request, res:Response)=>{
    try{
        const result= loginSchema.safeParse(req.body);
        if(!result.success){
            return res.status(400).json({
                success:false,
                message:result.error.issues[0].message
            });
        }
        const {email, password}= result.data;
        const data= await loginUser(email, password);
        return res.status(200).json({
            success:true,
            message:"login successful",
            ...data
        });
    }catch(error){
        const message= error instanceof Error
        ?error.message
        :"login failed";
          const status = message === "Invalid email or password"
      ? 401
      : message === "Your account is inactive"
        ? 403
        : 500;

    return res.status(status).json({
      success: false,
      message
    });
  }
};


export const getMe = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first"
      });
    }

    const user = await User.findById(userId)
      .select("_id name email phone role isActive");

    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account not found or inactive"
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch user profile"
    });
  }
};

export const migrateLegacyAccount = async (
  req: Request,
  res: Response
) => {
  try {
    const result = migrateLegacySchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0].message
      });
    }

    const { email, password } = result.data;

    const migrated = await migrateLegacyUserToFirebase(
      email,
      password
    );

    return res.status(200).json({
      success: true,
      message: "Account successfully migrated to Firebase",
      firebaseUid: migrated.firebaseUid
    });

  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Account migration failed";

    const status =
      message === "Invalid email or password" ? 401 :
      message === "Your account is inactive" ||
      message === "Firebase account is disabled" ? 403 :
      500;

    return res.status(status).json({
      success: false,
      message:
        status === 500
          ? "Account migration failed. Please contact support."
          : message
    });
  }
};