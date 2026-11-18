
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { z } from "zod";

import User from "../users/user.model";
import { registerSchema } from "./auth.validation";
import { firebaseAdminAuth } from "../../config/firebase-admin";
import { firebaseRegisterSchema } from "./auth.validation";

const generateToken = (userId: string, role: string) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }

  const expiresIn = (
    process.env.JWT_EXPIRES_IN || "15m"
  ) as SignOptions["expiresIn"];

  return jwt.sign(
    { userId, role },
    secret,
    { expiresIn }
  );
};

const isDuplicateEmailError = (error: unknown) => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const mongoError = error as {
    code?: number;
    keyPattern?: Record<string, unknown>;
  };

  return (
    mongoError.code === 11000 &&
    Boolean(mongoError.keyPattern?.email)
  );
};

export const registerUser = async (
  data: z.infer<typeof registerSchema>
) => {
  const email = data.email.trim().toLowerCase();

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("Email is already registered");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  try {
    const user = await User.create({
      ...data,
      email,
      password: passwordHash,
      role: "citizen"
    });

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    };
  } catch (error) {
   
    if (isDuplicateEmailError(error)) {
      throw new Error("Email is already registered");
    }

    throw error;
  }
};

export const loginUser = async (
  email: string,
  password: string
) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail
  }).select("+password");

  if (!user) {
    throw new Error("Invalid email or password");
  }

if (!user.password) {
  throw new Error("Invalid email or password");
}

const passwordMatches = await bcrypt.compare(
  password,
  user.password
);
  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error("Your account is inactive");
  }

  const token = generateToken(
    user._id.toString(),
    user.role
  );

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    },
    token
  };
};



const isFirebaseUserNotFound = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "auth/user-not-found"
  );
};
export const migrateLegacyUserToFirebase = async (
  email: string,
  password: string
) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail
  }).select("+password");

  if (!user || !user.password) {
    throw new Error("Invalid email or password");
  }
  if (!user.isActive) {
    throw new Error("Your account is inactive");
  }
  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );
  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }
  let firebaseUser;

  if (user.firebaseUid) {
    firebaseUser = await firebaseAdminAuth.getUser(
      user.firebaseUid
    );
  } else {
  
    try {
      firebaseUser = await firebaseAdminAuth.getUserByEmail(
        normalizedEmail
      );
    } catch (error) {
      if (!isFirebaseUserNotFound(error)) {
        throw error;
      }
      firebaseUser = await firebaseAdminAuth.createUser({
        email: normalizedEmail,
        password,
        displayName: user.name,
        emailVerified: false,
        disabled: false
      });
    }
  }
  if (firebaseUser.disabled) {
    throw new Error("Firebase account is disabled");
  }
  if (
    firebaseUser.email?.toLowerCase() !== normalizedEmail
  ) {
    throw new Error("Account email mismatch");
  }
  await firebaseAdminAuth.updateUser(firebaseUser.uid, {
    password
  });

  user.firebaseUid = firebaseUser.uid;
  await user.save();

  return {
    firebaseUid: firebaseUser.uid
  };
};

export const registerFirebaseUser = async (
  data: z.infer<typeof firebaseRegisterSchema>,
  firebaseUid: string
) => {
  const email = data.email.trim().toLowerCase();
  const existingUid = await User.findOne({ firebaseUid });
  if (existingUid) {
    throw new Error("Firebase account already registered");
  }

  const existingEmail = await User.findOne({ email });

  if (existingEmail) {
    throw new Error(
      "Email is already registered. Please login or migrate your existing account."
    );
  }

  const user = await User.create({
    name: data.name.trim(),
    email,
    phone: data.phone.trim(),
    firebaseUid,
    role: "citizen",
    isActive: true
  });

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role
  };
};
