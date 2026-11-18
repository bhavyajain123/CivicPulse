
import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(3, "Department name must be at least 3 characters"),

  description: z.string().trim().min(10, "Description must be at least 10 characters")
});


export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(3).optional(),

  description: z.string().trim().min(10).optional()
}).refine(
  (data) => data.name !== undefined || data.description !== undefined,
  {
    message: "At least one field is required"
  }
);
