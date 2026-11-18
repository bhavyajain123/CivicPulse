import { api } from "./api";

export type FeedbackStatus = "pending" | "reviewed";

export type FeedbackIncident = {
  _id: string;
  title: string;
  category: string;
  status: string;
};

export type FeedbackUser = {
  _id: string;
  name?: string;
  email?: string;
};

export type Feedback = {
  _id: string;
  userId: string | FeedbackUser;
  incidentId: string | FeedbackIncident;
  rating: number;
  comment: string;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
};

type FeedbackListResponse = {
  success: boolean;
  count: number;
  feedback: Feedback[];
};

type FeedbackResponse = {
  success: boolean;
  message: string;
  feedback: Feedback;
};

export const feedbackService = {
  create: async (input: {
    incidentId: string;
    rating: number;
    comment: string;
  }) =>
    api<FeedbackResponse>("/feedback", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getMine: async (): Promise<Feedback[]> => {
    const response = await api<FeedbackListResponse>("/feedback/my");
    return response.feedback;
  },

  getAll: async (): Promise<Feedback[]> => {
    const response = await api<FeedbackListResponse>("/feedback");
    return response.feedback;
  },

  updateStatus: async (
    id: string,
    status: FeedbackStatus
  ) =>
    api<FeedbackResponse>(`/feedback/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};