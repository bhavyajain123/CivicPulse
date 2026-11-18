import { api } from "./api";

export type UserRole =
  | "citizen"
  | "operator"
  | "officer"
  | "response_team"
  | "admin";

export type CivicUser = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  departmentId?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateProfileInput = {
  name?: string;
  phone?: string;
};
export type CreateUserInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  departmentId?: string;
};

type UserResponse = {
  success: boolean;
  message?: string;
  user: CivicUser;
};

type UsersResponse = {
  success: boolean;
  count: number;
  users: CivicUser[];
};

type MessageResponse = {
  success: boolean;
  message: string;
};

export const userService = {
  getProfile: async (): Promise<CivicUser> => {
    const response = await api<UserResponse>("/users/profile");
    return response.user;
  },


  updateProfile: async (
    data: UpdateProfileInput
  ): Promise<CivicUser> => {
    const response = await api<UserResponse>("/users/profile", {
      method: "PATCH",
      body: JSON.stringify(data)
    });

    return response.user;
  },

  create: async (data: CreateUserInput): Promise<CivicUser> => {
  const response = await api<UserResponse>("/users", {
    method: "POST",
    body: JSON.stringify(data)
  });

  return response.user;
},

  getAll: async (): Promise<CivicUser[]> => {
    const response = await api<UsersResponse>("/users");
    return response.users;
  },


  getById: async (id: string): Promise<CivicUser> => {
    const response = await api<UserResponse>(
      `/users/${encodeURIComponent(id)}`
    );

    return response.user;
  },

  updateRole: async (
    id: string,
    role: UserRole
  ): Promise<CivicUser> => {
    const response = await api<UserResponse>(
      `/users/${encodeURIComponent(id)}/role`,
      {
        method: "PATCH",
        body: JSON.stringify({ role })
      }
    );

    return response.user;
  },


  updateStatus: async (
    id: string,
    isActive: boolean
  ): Promise<CivicUser> => {
    const response = await api<UserResponse>(
      `/users/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ isActive })
      }
    );

    return response.user;
  },


  resetPassword: async (
    id: string,
    password: string
  ): Promise<string> => {
    const response = await api<MessageResponse>(
      `/users/${encodeURIComponent(id)}/password`,
      {
        method: "PATCH",
        body: JSON.stringify({ password })
      }
    );

    return response.message;
  }
};