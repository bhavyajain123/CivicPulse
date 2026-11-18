
import { Request, Response } from "express";

import {
  createDepartmentSchema,
  updateDepartmentSchema
} from "./department.validation";

import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
} from "./department.service";

export const createDepartmentController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = createDepartmentSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0].message
      });
    }

    const department = await createDepartment(result.data);

    return res.status(201).json({
      success: true,
      message: "Department created successfully",
      department
    });

  } catch (error) {
    console.error("Create department error:", error);

    if (error instanceof Error && error.message === "department already exists") {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
};


export const getAllDepartmentsController = async (
  req: Request,
  res: Response
) => {
  try {
    const departments = await getAllDepartments();

    return res.status(200).json({
      success: true,
      count: departments.length,
      departments
    });

  } catch (error) {
    console.error("Get departments error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
};


export const getDepartmentByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const department = await getDepartmentById(req.params.id as string);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    return res.status(200).json({
      success: true,
      department
    });

  } catch (error) {
    console.error("Get department error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch department"
    });
  }
};

export const updateDepartmentController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = updateDepartmentSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0].message
      });
    }

    const department = await updateDepartment(
      req.params.id as string,
      result.data
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Department updated successfully",
      department
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "department already exists") {
      return res.status(409).json({
        success: false,
        message
      });
    }

    console.error("Update department error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update department"
    });
  }
};


export const deleteDepartmentController = async (
  req: Request,
  res: Response
) => {
  try {
    const department = await deleteDepartment(req.params.id as string);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Department deleted successfully"
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.startsWith("Cannot delete department")) {
      return res.status(409).json({
        success: false,
        message
      });
    }

    console.error("Delete department error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete department"
    });
  }
};
