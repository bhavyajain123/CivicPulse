
import { z } from "zod";

export const analyzeIncidentSchema = z.object({
  description: z
    .string()
    .trim()
    .min(10, "Incident description must be at least 10 characters")
    .max(3000, "Incident description cannot exceed 3000 characters"),

  location: z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180)
  }).optional()
});

export type AnalyzeIncidentInput = z.infer<
  typeof analyzeIncidentSchema
>;
export const checkDuplicatesSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5)
    .max(150),

  description: z
    .string()
    .trim()
    .min(10)
    .max(3000),

  category: z.enum([
    "fire",
    "accident",
    "medical",
    "crime",
    "other"
  ]),

  location: z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180)
  })
});

export const recommendTeamsSchema = z.object({
  title: z.string().trim().min(5).max(150),
  description: z.string().trim().min(10).max(3000),
  category: z.enum(["fire", "accident", "medical", "crime", "other"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  location: z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180)
  })
});