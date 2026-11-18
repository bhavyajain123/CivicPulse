
import { api } from "./api";

export type Incident = {
  _id: string;
  title: string;
  description: string;

  category: "fire" | "accident" | "medical" | "crime" | "other";

  location: {
    latitude: number;
    longitude: number;
    address: string;
  };

  priority: "low" | "medium" | "high" | "critical";

  status:
    | "pending"
    | "verified"
    | "assigned"
    | "in_progress"
    | "resolved";

  reportedBy: {
    name?: string;
    email?: string;
  };

  assignedTeam?: {
    _id?: string;
    name?: string;
    isAvailable?: boolean;
    currentLocation?: {
      latitude?: number;
      longitude?: number;
      updatedAt?: string;
    };
  } | null;

  resolutionRemarks?: string;

  resolutionImages?: {
    url: string;
    publicId: string;
    format?: string;
    width?: number;
    height?: number;
  }[];

  resolvedAt?: string | null;
  statusHistory?: {
  status: "pending" | "verified" | "assigned" | "in_progress" | "resolved";
  message: string;
  updatedBy?: string | null;
  timestamp: string;
}[];

  createdAt: string;
  updatedAt: string;
};
type IncidentResponse = {
  success: boolean;
  count: number;
  incidents: Incident[];
};

type CreateIncidentBase = {
  title: string;
  description: string;
  category: "fire" | "accident" | "medical" | "crime" | "other";
};

export type CreateIncidentInput = CreateIncidentBase & (
  | {
      location: {
        latitude: number;
        longitude: number;
      };
      locationAddress?: never;
    }
  | {
      locationAddress: string;
      location?: never;
    }
);

export const incidentService ={
  getAll: async (): Promise<Incident[]> => {
    const response = await api<IncidentResponse>("/incidents");
    return response.incidents;
  },
  getMine: async (): Promise<Incident[]> => {
  const response = await api<IncidentResponse>("/incidents/my-incidents");
  return response.incidents;
},

  getAssigned: async (): Promise<Incident[]> => {
    const response = await api<IncidentResponse>("/incidents/assigned");
    return response.incidents;
  },
  getTimeline: async (id: string) => {
  return api<{
    success: boolean;
    message: string;
    timeline: {
      status: Incident["status"];
      message: string;
      updatedBy?: string | null;
      timestamp: string;
    }[];
  }>(`/incidents/${encodeURIComponent(id)}/timeline`);
},

  create: async (input: CreateIncidentInput) => {
    return api<{
      success: boolean;
      message: string;
      incident: Incident;
    }>("/incidents", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  updateStatus: async (
    id: string,
    input: {
      status?: Incident["status"];
      priority?: Incident["priority"];
    }
  ) => {
    return api<{
      success: boolean;
      message: string;
      incident: Incident;
    }>(`/incidents/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  },
    addResolutionPhotos: async (
    id: string,
    images: File[]
  ) => {
    const formData = new FormData();

    images.forEach((file) => {
      formData.append("resolutionImages", file);
    });

    return api<{
      success: boolean;
      message: string;
      incident: Incident;
    }>(
      `/incidents/${encodeURIComponent(id)}/resolution-photos`,
      {
        method: "POST",
        body: formData
      }
    );
  }
};
