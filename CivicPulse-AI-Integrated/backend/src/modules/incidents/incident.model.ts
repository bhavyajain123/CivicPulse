import mongoose, { Schema } from "mongoose";

const statusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: [
        "pending",
        "verified",
        "assigned",
        "in_progress",
        "resolved"
      ],
      required: true
    },

    message: {
      type: String,
      trim: true,
      required: true
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const incidentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    category: {
      type: String,
      enum: ["fire", "accident", "medical", "crime", "other"],
      required: true
    },

    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, default: "" }
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium"
    },

    status: {
      type: String,
      enum: [
        "pending",
        "verified",
        "assigned",
        "in_progress",
        "resolved"
      ],
      default: "pending"
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: []
    },

    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    assignedTeam: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      default: null
    },

    images: [
      {
        url: {
          type: String,
          required: true
        },
        publicId: {
          type: String,
          required: true
        },
        format: {
          type: String
        },
        width: {
          type: Number
        },
        height: {
          type: Number
        }
      }
    ],

    resolutionRemarks: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ""
    },

    resolutionImages: [
      {
        url: {
          type: String,
          required: true
        },
        publicId: {
          type: String,
          required: true
        },
        format: String,
        width: Number,
        height: Number
      }
    ],

    resolvedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const Incident = mongoose.model("Incident", incidentSchema);

export default Incident;