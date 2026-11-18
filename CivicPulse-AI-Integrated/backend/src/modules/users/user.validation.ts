
import { z } from "zod";

export const objectIdSchema = z.string().regex(
  /^[0-9a-fA-F]{24}$/,
  "Invalid user ID"
);

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  phone: z.string().trim().min(10).max(15).optional()
}).refine(
  (data) => data.name !== undefined || data.phone !== undefined,
  {
    message: "At least one field is required"
  }
);

export const updateUserRoleSchema = z.object({
  role: z.enum([
    "citizen",
    "operator",
    "officer",
    "response_team",
    "admin"
  ])
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean()
});
export const resetUserPasswordSchema= z.object({
    password: z.string().min(8).max(100),
});
export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(50),

  email: z.string().trim().email().toLowerCase(),

  phone: z.string().trim().min(10).max(15),

  password: z.string().min(8).max(100),

  role: z.enum([
    "citizen",
    "operator",
    "officer",
    "response_team"
  ]),

  departmentId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid department ID")
    .optional()
}).refine(
  data =>
    data.role !== "response_team" ||
    Boolean(data.departmentId),
  {
    message: "Department is required for response team users",
    path: ["departmentId"]
  }
);