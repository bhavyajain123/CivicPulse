import { api } from "./api";

export type SupportCategory =
  | "Technical issue"
  | "Incident workflow"
  | "Account access"
  | "Other request";

export type SupportStatus =
  | "open"
  | "in_progress"
  | "resolved";

export type CreateSupportRequestInput = {
  email: string;
  category: SupportCategory;
  message: string;
};

export type SupportRequest = {
  _id: string;
  email: string;
  category: SupportCategory;
  message: string;
  status: SupportStatus;
  createdAt: string;
  updatedAt: string;
};

type SupportApiResponse = {
  success: boolean;
  message: string;
  supportRequest: SupportRequest;
};

type SupportListResponse = {
  success: boolean;
  count: number;
  supportRequests: SupportRequest[];
};

export const supportService = {

 
  create: async (
    data: CreateSupportRequestInput
  ): Promise<SupportRequest> => {
    const response = await api<SupportApiResponse>("/support", {
      method: "POST",
      body: JSON.stringify(data)
    });

    if (!response.success) {
      throw new Error(
        response.message || "Failed to submit support request"
      );
    }

    return response.supportRequest;
  },

  getAll: async (): Promise<SupportRequest[]> => {
    const response = await api<SupportListResponse>("/support");

    if (!response.success) {
      throw new Error("Failed to fetch support requests");
    }

    return response.supportRequests;
  },

  
  getById: async (id: string): Promise<SupportRequest> => {
    const response = await api<SupportApiResponse>(
      `/support/${encodeURIComponent(id)}`
    );

    if (!response.success) {
      throw new Error(
        response.message || "Failed to fetch support request"
      );
    }

    return response.supportRequest;
  },

  
  updateStatus: async (
    id: string,
    status: SupportStatus
  ): Promise<SupportRequest> => {
    const response = await api<SupportApiResponse>(
      `/support/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status })
      }
    );

    if (!response.success) {
      throw new Error(
        response.message || "Failed to update support request"
      );
    }

    return response.supportRequest;
  }
};