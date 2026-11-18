import { api } from "./api";

export type AssignmentStatus =
  | "assigned"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled";

export type CreateAssignmentInput = {
  incidentId: string;
  teamId: string;
  notes?: string;
};

export type UpdateAssignmentStatusInput = {
  status: "accepted" | "in_progress" | "completed" | "cancelled";
  notes?: string;
};

export type PopulatedIncident = {
  _id: string;
  title?: string;
  category?: string;
  status?: string;
  priority?: string;

  location?: {
    address?: string;
    latitude?: number;
    longitude?: number;
  };

  createdAt?: string;
};

export type PopulatedTeam = {
  _id: string;
  name?: string;
  isAvailable?: boolean;
};

export type Assignment = {
  _id: string;

  incidentId: string | PopulatedIncident;

  teamId: string | PopulatedTeam;

  assignedBy?: string | {
    _id: string;
    name?: string;
    email?: string;
  };

  status: AssignmentStatus;

  notes?: string;

  acceptedAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type AssignmentResponse = {
  success: boolean;
  message: string;
  assignment: Assignment;
};

type AssignmentListResponse = {
  success: boolean;
  count: number;
  assignments: Assignment[];
};

export const assignmentService = {


  create: async (
    input: CreateAssignmentInput
  ): Promise<AssignmentResponse> => {
    return api<AssignmentResponse>("/assignments", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  
  getAll: async (): Promise<Assignment[]> => {
    const response = await api<AssignmentListResponse>(
      "/assignments"
    );

    return response.assignments;
  },

  getMy: async (): Promise<Assignment[]> => {
    const response = await api<AssignmentListResponse>(
      "/assignments/my"
    );

    return response.assignments;
  },

  updateStatus: async (
    id: string,
    input: UpdateAssignmentStatusInput
  ): Promise<AssignmentResponse> => {
    return api<AssignmentResponse>(
      `/assignments/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify(input)
      }
    );
  },
  completeWithProof: (
  id: string,
  remarks: string,
  images: File[]
) => {
  const formData = new FormData();

  formData.append("status", "completed");
  formData.append("resolutionRemarks", remarks);

  images.forEach((file) => {
    formData.append("resolutionImages", file);
  });

  return api<AssignmentResponse>(
    `/assignments/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: formData
    }
  );
},
};