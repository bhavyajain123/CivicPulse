
import mongoose from "mongoose";
import Complaint from "./complaint.model";
import { createComplaintSchema, updateComplaintSchema,assignComplaintSchema,updateAssignedComplaintSchema} from "./complaint.validation";
import User from "../users/user.model";
import Team from "../response-teams/team.model";

export const createComplaint = async (
  userId: string,
  input: unknown
) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new Error("Invalid user ID");
  }

  const data = createComplaintSchema.parse(input);

  return Complaint.create({
    userId,
    ...data
  });
};

export const getMyComplaints = async (userId: string) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new Error("Invalid user ID");
  }

  return Complaint.find({ userId })
    .sort({ createdAt: -1 });
};

export const getAllComplaints = async () => {
  return Complaint.find()
    .populate("userId", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 });
};

export const getComplaintById = async (
  complaintId: string,
  userId: string,
  role: string
) => {
  if (!mongoose.isValidObjectId(complaintId)) {
    throw new Error("Invalid complaint ID");
  }

  const complaint = await Complaint.findById(complaintId)
    .populate("userId", "name email")
    .populate("assignedTo", "name email");

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  const ownerId = complaint.userId._id.toString();

  if (
    role !== "admin" &&
    role !== "operator" &&
    ownerId !== userId
  ) {
    throw new Error("You are not authorized to view this complaint");
  }

  return complaint;
};


export const updateComplaint = async (
  complaintId: string,
  input: unknown
) => {
  if (!mongoose.isValidObjectId(complaintId)) {
    throw new Error("Invalid complaint ID");
  }

  const data = updateComplaintSchema.parse(input);
  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  if (
    complaint.status === "resolved" ||
    complaint.status === "rejected"
  ) {
    throw new Error("Closed complaint cannot be updated");
  }

  const allowedTransitions: Record<string, string[]> = {
    submitted: ["under_review", "rejected"],
    under_review: ["in_progress", "rejected"],
    in_progress: ["resolved", "rejected"]
  };

  if (!allowedTransitions[complaint.status]?.includes(data.status)) {
    throw new Error("Invalid complaint status transition");
  }

  if (data.assignedTo) {
    if (!mongoose.isValidObjectId(data.assignedTo)) {
      throw new Error("Invalid assigned user ID");
    }

    const assignedUser = await User.findOne({
      _id: data.assignedTo,
      role: { $in: ["admin", "operator"] },
      isActive: true
    }).select("_id");

    if (!assignedUser) {
      throw new Error("Assigned user must be an active admin or operator");
    }

    complaint.assignedTo = assignedUser._id;
  }

  if (
    (data.status === "resolved" || data.status === "rejected") &&
    !data.resolutionRemarks?.trim()
  ) {
    throw new Error("Resolution remarks are required to close a complaint");
  }

  complaint.status = data.status;

  if (data.resolutionRemarks !== undefined) {
    complaint.resolutionRemarks = data.resolutionRemarks;
  }

  await complaint.save();

  return complaint;
};

export const assignComplaint = async (
  complaintId: string,
  input: unknown
) => {
  if (!mongoose.isValidObjectId(complaintId)) {
    throw new Error("Invalid complaint ID");
  }

  const data = assignComplaintSchema.parse(input);

  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  if (
    complaint.status === "resolved" ||
    complaint.status === "rejected"
  ) {
    throw new Error("Closed complaint cannot be assigned");
  }

  const [member, team] = await Promise.all([
    User.findOne({
      _id: data.assignedTo,
      role: "response_team",
      isActive: true
    }),
    Team.findOne({ members: data.assignedTo })
  ]);

  if (!member || !team) {
    throw new Error(
      "Select an active member of a response team"
    );
  }

  if (complaint.status !== "under_review") {
    throw new Error(
      "Complaint must be under review before assignment"
    );
  }

  complaint.assignedTo = member._id;
  await complaint.save();

  return Complaint.findById(complaintId)
    .populate("userId", "name email")
    .populate("assignedTo", "name email");
};

export const getAssignedComplaints = async (
  userId: string
) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new Error("Invalid user ID");
  }

  return Complaint.find({ assignedTo: userId })
    .populate("userId", "name email")
    .sort({ createdAt: -1 });
};

export const updateAssignedComplaint = async (
  complaintId: string,
  userId: string,
  input: unknown
) => {
  if (!mongoose.isValidObjectId(complaintId)) {
    throw new Error("Invalid complaint ID");
  }

  const data = updateAssignedComplaintSchema.parse(input);

  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  if (complaint.assignedTo?.toString() !== userId) {
    throw new Error("You are not assigned to this complaint");
  }

  const allowedTransitions: Record<string, string[]> = {
    under_review: ["in_progress"],
    in_progress: ["resolved", "rejected"]
  };

  if (
    !allowedTransitions[complaint.status]?.includes(data.status)
  ) {
    throw new Error("Invalid complaint status transition");
  }

  if (
    (data.status === "resolved" || data.status === "rejected") &&
    !data.resolutionRemarks?.trim()
  ) {
    throw new Error("Resolution remarks are required to close a complaint");
  }

  complaint.status = data.status;

  if (data.resolutionRemarks !== undefined) {
    complaint.resolutionRemarks = data.resolutionRemarks;
  }

  await complaint.save();

  return Complaint.findById(complaintId)
    .populate("userId", "name email")
    .populate("assignedTo", "name email");
};