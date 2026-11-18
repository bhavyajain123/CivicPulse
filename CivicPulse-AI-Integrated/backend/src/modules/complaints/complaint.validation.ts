import { z } from "zod";

export const createComplaintSchema = z.object({
  title: z.string().trim().min(5).max(150),
  description: z.string().trim().min(10).max(3000),
  category: z.enum([
    "water",
    "electricity",
    "road",
    "sanitation",
    "drainage",
    "streetlight",
    "other"
  ])
});

export const updateComplaintSchema = z.object({
  status: z.enum([
    "under_review",
    "in_progress",
    "resolved",
    "rejected"
  ]),
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  resolutionRemarks: z.string().trim().max(1000).optional()
});

export const assignComplaintSchema = z.object({
  assignedTo: z.string().regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid response team member ID"
  )
});

export const updateAssignedComplaintSchema = z.object({
  status: z.enum(["in_progress","resolved","rejected"]),
  resolutionRemarks: z.string().trim().max(1000).optional()
});