
import { api } from "./api";

export type TeamMember = {
  _id: string;
  name: string;
  email?: string;
};

export type ResponseTeam = {
  _id: string;
  name: string;
  isAvailable: boolean;
  departmentId?: {
    _id?: string;
    name?: string;
  } | string;
  members?: TeamMember[];
  currentLocation?: {
    latitude?: number;
    longitude?: number;
    updatedAt?: string;
  };
};

type TeamResponse = {
  success: boolean;
  count: number;
  teams: ResponseTeam[];
};

type SingleTeamResponse = {
  success: boolean;
  team: ResponseTeam;
};

type CreateTeamResponse = {
  success: boolean;
  message: string;
  team: ResponseTeam;
};

type TeamMemberMutationResponse = {
  success: boolean;
  message: string;
  team: ResponseTeam;
};

export const teamService = {
  getAll: async (): Promise<ResponseTeam[]> => {
    const response = await api<TeamResponse>("/teams");
    return response.teams;
  },

  getById: async (id: string): Promise<ResponseTeam> => {
    const response = await api<SingleTeamResponse>(`/teams/${id}`);
    return response.team;
  },

  create: async (input: {
    name: string;
    departmentId: string;
    members?: string[];
  }) => {
    return api<CreateTeamResponse>("/teams", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  addMember: async (teamId: string, userId: string) => {
    return api<TeamMemberMutationResponse>(
      `/teams/${teamId}/members`,
      {
        method: "POST",
        body: JSON.stringify({ userId })
      }
    );
  },

  removeMember: async (teamId: string, userId: string) => {
    return api<TeamMemberMutationResponse>(
      `/teams/${teamId}/members`,
      {
        method: "DELETE",
        body: JSON.stringify({ userId })
      }
    );
  }
};
