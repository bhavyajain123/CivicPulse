
import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import ApiError from "../../utils/ApiError";
import { resetUserPassword } from "./user.service";
import {
  getAllUsers,
  getUserById,
  updateUserProfile,
  updateUserRole,
  updateUserStatus,
  createUser
} from "./user.service";

import {
  updateUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  objectIdSchema,
  resetUserPasswordSchema,
  createUserSchema
} from "./user.validation";

export const getProfile = async (
  req: AuthRequest,
  res: Response
) => {
  const user = await getUserById(req.user!.userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json({
    success: true,
    user
  });
};

export const getAllUsersController = async (
  req: AuthRequest,
  res: Response
) => {
  const users = await getAllUsers();

  return res.status(200).json({
    success: true,
    count: users.length,
    users
  });
};

export const getUserByIdController = async (
  req: AuthRequest,
  res: Response
) => {
  const id = objectIdSchema.parse(req.params.id);
  const user = await getUserById(id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json({
    success: true,
    user
  });
};

export const updateProfileController = async (
  req: AuthRequest,
  res: Response
) => {
  const validation = updateUserSchema.parse(req.body);

  const user = await updateUserProfile(
    req.user!.userId,
    validation
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user
  });
};

export const updateUserRoleController = async (
  req: AuthRequest,
  res: Response
) => {
  const id = objectIdSchema.parse(req.params.id);
  const validation = updateUserRoleSchema.parse(req.body);

  const user = await updateUserRole(id, validation.role);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json({
    success: true,
    message: "User role updated successfully",
    user
  });
};

export const updateUserStatusController = async (
  req: AuthRequest,
  res: Response
) => {
  const id = objectIdSchema.parse(req.params.id);
  const validation = updateUserStatusSchema.parse(req.body);

  const user = await updateUserStatus(
    id,
    validation.isActive
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json({
    success: true,
    message: "User status updated successfully",
    user
  });
};

export const resetUserPasswordController= async(
    req:AuthRequest,
    res:Response
)=>{
    const idResult= objectIdSchema.safeParse(req.params.id);
    if(!idResult.success){
        throw new ApiError(400, "invalid user id");
    }
    const bodyResult= resetUserPasswordSchema.safeParse(req.body);

    if(!bodyResult.success){
        throw new ApiError(400, bodyResult.error.issues[0].message);
    }
    const result= await resetUserPassword(
        idResult.data,
        bodyResult.data.password
    );
    return res.status(200).json({
        success: true,
        ...result,
    });
};

export const createUserController = async (
  req: AuthRequest,
  res: Response
) => {
  const result = createUserSchema.safeParse(req.body);

  if (!result.success) {
    throw new ApiError(
      400,
      result.error.issues[0].message
    );
  }

  const user = await createUser(result.data);

  return res.status(201).json({
    success: true,
    message: "User created successfully",
    user
  });
};