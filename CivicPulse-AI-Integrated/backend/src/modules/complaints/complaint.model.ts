import mongoose, { Schema, Document } from "mongoose";

export type ComplaintStatus =
  | "submitted"| "under_review"|"in_progress"|"resolved"|"rejected";

export interface IComplaint extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  status: ComplaintStatus;
  assignedTo?: mongoose.Types.ObjectId;
  resolutionRemarks?: string;
}

const complaintSchema = new Schema<IComplaint>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: [
        "submitted",
        "under_review",
        "in_progress",
        "resolved",
        "rejected"
      ],
      default: "submitted"
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    resolutionRemarks: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  { timestamps: true }
);

complaintSchema.index({ userId: 1, createdAt: -1 });
  complaintSchema.index({status: 1 });
const Complaint = mongoose.model<IComplaint>(
  "Complaint",
  complaintSchema
);

export default Complaint;