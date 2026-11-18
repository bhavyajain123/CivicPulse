
import { api } from "./api";

export type Department = {
  _id: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
};

type DepartmentListResponse ={
  success: boolean;
  count: number;
  departments: Department[];
};

type DepartmentResponse = {
  success: boolean;
  message: string;
  department: Department;
};

type DeleteDepartmentResponse = {
  success: boolean;
  message: string;
};

export const departmentService = {
  getAll: async (): Promise<Department[]> => {
    const response = await api<DepartmentListResponse>("/departments");
    return response.departments;
  },

  create: async (input: {
    name: string;
    description: string;
  }) => {
    return api<DepartmentResponse>("/departments", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  update: async (
    id: string,
    input: {
      name?: string;
      description?: string;
    }
  ) => {
    return api<DepartmentResponse>(`/departments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  },

  delete: async (id: string) => {
    return api<DeleteDepartmentResponse>(`/departments/${id}`, {
      method: "DELETE"
    });
  }
};
