import Feedback from "./feedback.model";
import Incident from "../incidents/incident.model";
import { createFeedbackSchema, updateFeedbackSchema } from "./feedback.validation";

export const createFeedback= async(
    userId: string,
    input:unknown
)=>{
    const data= createFeedbackSchema.parse(input);
    const incident= await Incident.findById(data.incidentId);
    if (!incident) {
    throw new Error("Incident not found");
  }

  if (incident.status !== "resolved") {
    throw new Error("Feedback can only be submitted for resolved incidents");
  }

  const existingFeedback = await Feedback.findOne({
    userId,
    incidentId: data.incidentId
  });

  if (existingFeedback) {
    throw new Error("You have already submitted feedback for this incident");
  }

  return Feedback.create({
    userId,
    incidentId: data.incidentId,
    rating: data.rating,
    comment: data.comment
  });
};
export const getMyFeedback = async (userId: string) => {
  return Feedback.find({ userId })
    .populate("incidentId", "title category status")
    .sort({ createdAt: -1 });
};
export const getAllFeedback = async () => {
  return Feedback.find()
    .populate("userId", "name email")
    .populate("incidentId", "title category status")
    .sort({ createdAt: -1 });
};
export const updateFeedbackStatus = async (
  feedbackId: string,
  input: unknown
) => {
  const data = updateFeedbackSchema.parse(input);

  return Feedback.findByIdAndUpdate(
    feedbackId,
    { status: data.status },
    { new: true, runValidators: true }
  )
    .populate("userId", "name email")
    .populate("incidentId", "title category status");
};
