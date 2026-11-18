import {api} from "./api";
export type ComplaintStatus =
  | "submitted"
  | "under_review"
  | "in_progress"
  | "resolved"
  | "rejected";

export type ComplaintUser = {
  _id: string;
  name?: string;
  email?: string;
};

export type Complaint = {
  _id: string;
  userId: string | ComplaintUser;
  title: string;
  description: string;
  category:
    | "water"
    | "electricity"
    | "road"
    | "sanitation"
    | "drainage"
    | "streetlight"
    | "other";
  status: ComplaintStatus;
  assignedTo?: string | ComplaintUser | null;
  resolutionRemarks?: string;
  createdAt: string;
  updatedAt: string;
};

type ComplaintListResponse = {
  success: boolean;
  count: number;
  data: Complaint[];
};

type ComplaintResponse = {
  success: boolean;
  message?: string;
  data: Complaint;
};

type ComplaintUpdateInput = {
  status: Exclude<ComplaintStatus, "submitted">;
  assignedTo?: string;
  resolutionRemarks?: string;
};

export const complaintService = {
  
  getAll: async () => {
    const response =
      await api<ComplaintListResponse>("/complaints");

    return response.data;
  },

  
  getMine: async () => {
    const response =
      await api<ComplaintListResponse>("/complaints/my");

    return response.data;
  },

  create: async (input: {
    title: string;
    description: string;
    category: Complaint["category"];
  }) =>
    api<ComplaintResponse>("/complaints", {
      method: "POST",
      body: JSON.stringify(input),
    }),


  getById: async (id: string) =>
    api<ComplaintResponse>(`/complaints/${id}`),


  update: async (
    id: string,
    input: ComplaintUpdateInput
  ) =>
    api<ComplaintResponse>(`/complaints/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
      assign: async (id: string, assignedTo: string) =>
    api<ComplaintResponse>(`/complaints/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ assignedTo }),
    }),

  getAssigned: async () => {
    const response = await api<ComplaintListResponse>(
      "/complaints/assigned"
    );
    return response.data;
  },

  updateAssigned: async(
    id:string,
    input: {
      status:"in_progress"|"resolved"|"rejected" ;
      resolutionRemarks?: string;
    }
  ) =>
    api<ComplaintResponse>(`/complaints/${id}/assigned-status`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
};

