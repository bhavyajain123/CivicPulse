import type { AuthUser } from "./types";

export const rooms = {
  
  user: (id: string) => `user-${id}`,
  incident: (id: string) => `incident-${id}`,
  dashboard: "incident-dashboard",


  role: (role: string) => `role-${role}`,
  department: (id: string) => `department-${id}`,
  team: (id: string) => `team-${id}`,

 
  complaint: (id: string) => `complaint-${id}`
};

export const userRooms = (user: AuthUser): string[] => {
  const result = [
    rooms.user(user.userId),
    rooms.role(user.role)
  ];

  if (user.departmentId) {
    result.push(rooms.department(user.departmentId));
  }

  return result;
};