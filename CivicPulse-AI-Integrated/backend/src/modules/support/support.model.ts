import mongoose, { Schema } from "mongoose";

const supportRequestSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Technical issue",
        "Incident workflow",
        "Account access",
        "Other request"
      ]
    },

    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      maxlength: 3000
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open"
    }
  },
  {
    timestamps: true
  }
);

const SupportRequest = mongoose.model(
  "SupportRequest",
  supportRequestSchema
);

export default SupportRequest;