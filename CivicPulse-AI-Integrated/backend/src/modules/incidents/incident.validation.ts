
import { z } from "zod";

export const createIncidentSchema = z.object({
  title: z.string()
    .trim()
    .min(5, "Title must be at least 5 characters"),

  description: z.string()
    .trim()
    .min(10, "Description must be at least 10 characters"),

  category: z.enum([
    "fire",
    "accident",
    "medical",
    "crime",
    "other"
  ]),

  location: z.object({
    latitude: z.coerce.number()
      .min(-90)
      .max(90),

    longitude: z.coerce.number()
      .min(-180)
      .max(180)
  })
});

export const updateIncidentStatusSchema = z.object({
status: z.enum([
  "pending",
  "verified",
  "assigned",
  "in_progress",
  "resolved"
]).optional(),

  priority: z.enum([
    "low",
    "medium",
    "high",
    "critical"
  ]).optional()
}).refine(
  (data) => data.status !== undefined || data.priority !== undefined,
  {
    message: "Please provide status or priority"
  }
);

export const assignIncidentSchema = z.object({
  teamId: z.string().regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid response team ID"
  )
});
export const incidentIdSchema= z.string().regex(
     /^[0-9a-fA-F]{24}$/, "Invalid incident ID"
);