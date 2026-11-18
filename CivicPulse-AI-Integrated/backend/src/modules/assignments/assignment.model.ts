import mongoose,{Schema, Document} from "mongoose";
export interface IAssignment extends Document{
      incidentId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  status: "assigned" | "accepted" | "in_progress" | "completed" | "cancelled";
  assignedAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  notes?: string;
}
const assignmentSchema = new Schema<IAssignment>(
  {
    incidentId: {
      type: Schema.Types.ObjectId,
      ref: "Incident",
      required: true
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["assigned", "accepted", "in_progress", "completed", "cancelled"],
      default: "assigned"
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    acceptedAt: Date,
    completedAt: Date,
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  { timestamps: true }
);

assignmentSchema.index({ incidentId: 1 });
assignmentSchema.index({ teamId: 1, status: 1 });

const Assignment = mongoose.model<IAssignment>(
  "Assignment",
  assignmentSchema
);

export default Assignment;