
import mongoose from "mongoose";

import { z } from "zod";
import Department from "./department.model";
import { createDepartmentSchema } from "./department.validation";
import User from "../users/user.model";
import Team from "../response-teams/team.model";

export const createDepartment = async (
  data: z.infer<typeof createDepartmentSchema>
) => {
  const existingDepartment = await Department.findOne({
    name: data.name
  });

  if (existingDepartment) {
    throw new Error("department already exists");
  }

  const department = await Department.create(data);

  return department;
};


export const getAllDepartments = async () => {
  return await Department.find().sort({ name: 1 });
};


export const getDepartmentById = async (
  departmentId: string
) => {
  return await Department.findById(departmentId);
};


export const updateDepartment = async (
  departmentId: string,
  data: {
    name?: string;
    description?: string;
  }
) => {
  if (data.name) {
    const existingDepartment = await Department.findOne({
      name: data.name,
      _id: { $ne: departmentId }
    });

    if (existingDepartment) {
      throw new Error("department already exists");
    }
  }

  return await Department.findByIdAndUpdate(
    departmentId,
    data,
    {
      new: true,
      runValidators: true
    }
  );
};


export const deleteDepartment = async (
  departmentId: string
) => {
  const department = await Department.findById(departmentId);

  if (!department) {
    return null;
  }

  
 

  const userExists = await User.exists({
    departmentId
  });

  if (userExists) {
    throw new Error("Cannot delete department because users are assigned to it");
  }

 

  const teamExists = await Team.exists({
    departmentId
  });

  if (teamExists) {
    throw new Error("Cannot delete department because teams are assigned to it");
  }

  await Department.findByIdAndDelete(departmentId);

  return department;
};
