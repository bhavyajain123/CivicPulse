import User from "./user.model";
import bcrypt from "bcryptjs";
import Department from "../departments/department.model";
import ApiError from "../../utils/ApiError";
import { z } from "zod";
import { createUserSchema } from "./user.validation";

export const getAllUsers = async () => {
  return await User.find()
    .select("-password")
    .sort({ createdAt: -1 });
};

export const getUserById = async (userId: string) => {
  return await User.findById(userId).select("-password");
};
export const updateUserProfile = async (
  userId: string,
  data: {
    name?: string;
    phone?: string;
  }
) => {
  return await User.findByIdAndUpdate(
    userId,
    data,
    {
      new: true,
      runValidators: true
    }
  ).select("-password");
};
export const updateUserRole = async (
  userId: string,
  role: string
) => {
  return await User.findByIdAndUpdate(
    userId,
    { role },
    {
      new: true,
      runValidators: true
    }
  ).select("-password");
};
export const updateUserStatus = async (
  userId: string,
  isActive: boolean
) => {
  return await User.findByIdAndUpdate(
    userId,
    { isActive },
    {
      new: true,
      runValidators: true
    }
  ).select("-password");
};

export const resetUserPassword= async(
    userId: string,
    newPassword:string
)=>{
    const hashedPassword= await bcrypt.hash(newPassword, 10);
    const user= await User.findById(userId);
    if(!user){
        throw new Error("user not found");
    }
    user.password= hashedPassword;
    await user.save();

    return{
        message:"password reset successfully"
    };
};
export const createUser = async (
  data: z.infer<typeof createUserSchema>
) => {
  const existingUser = await User.findOne({
    email: data.email
  });

  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  if (data.departmentId) {
    const department = await Department.findById(
      data.departmentId
    );

    if (!department) {
      throw new ApiError(404, "Department not found");
    }
  }

  const hashedPassword = await bcrypt.hash(
    data.password,
    10
  );

  const user = await User.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    password: hashedPassword,
    role: data.role,
    departmentId: data.departmentId || null,
    isActive: true
  });

  return User.findById(user._id).select("-password");
};