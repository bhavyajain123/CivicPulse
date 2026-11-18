import{z} from "zod";

export const createAssignmentSchema= z.object({
    incidentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid incident ID"),
    teamId:z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid team ID"),
    notes:z.string().trim().max(500).optional()
});
export const updateAssignmentStatusSchema = z.object({
  status: z.enum([
    "accepted",
    "in_progress",
    "completed",
    "cancelled"
  ]),

  notes: z.string().trim().max(500).optional(),

  resolutionRemarks: z.string()
    .trim()
    .max(1000, "Resolution remarks cannot exceed 1000 characters")
    .optional()

}).superRefine((data, ctx) => {
  if (
    data.status === "completed" &&
    !data.resolutionRemarks?.trim()
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["resolutionRemarks"],
      message: "Resolution remarks are required to complete an incident"
    });
  }
});