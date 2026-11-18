
import { z } from "zod";

const objectIdSchema = z.string().regex(
  /^[0-9a-fA-F]{24}$/,
  "Invalid ID"
);

export const createTeamSchema = z.object({
  name: z.string().trim().min(3, "Team name must be at least 3 characters"),
  departmentId: objectIdSchema,
  members: z.array(objectIdSchema).optional()
});

export const updateTeamSchema = z.object({
  name: z.string().trim().min(3).optional(),
  departmentId: objectIdSchema.optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  "At least one field is required"
);

export const teamMemberSchema = z.object({
  userId: objectIdSchema
});
