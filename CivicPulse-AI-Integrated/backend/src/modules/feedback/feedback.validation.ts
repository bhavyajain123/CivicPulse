import {z} from "zod";

export const createFeedbackSchema= z.object({
    incidentId:z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid incident ID"),

    rating:z
    .number()
    .int("rating must be whole no")
    .min(1, "min rating is 1")
    .max(5,"maximum rating is 5"),

      comment: z
    .string()
    .trim()
    .min(5, "Comment must be at least 5 characters")
    .max(1000, "Comment cannot exceed 1000 characters")
});

export const updateFeedbackSchema = z.object({
  status: z.enum(["pending", "reviewed"])
});