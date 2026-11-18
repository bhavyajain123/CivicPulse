import type { Socket } from "socket.io";

export type UserRole =
  | "citizen"
  | "admin"
  | "operator"
  | "officer"
  | "response_team";

export interface AuthUser {
  userId: string;
  role: UserRole;
  departmentId?: string;
}

export interface SocketData {
  user: AuthUser;
  connectedAt?: number;
}

export type CivicSocket = Socket<
  any,
  any,
  any,
  SocketData
>;

export interface SocketAck {
  ok: boolean;
  message?: string;
  code?: string;
  data?: unknown;
}

export interface IncidentLocationPayload {
  incidentId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

export interface TrackingUpdatePayload
  extends IncidentLocationPayload {
  userId: string;
  timestamp: string;
}

export interface PresencePayload {
  userId: string;
  online: boolean;
}

export interface ComplaintStatusPayload {
  complaintId: string;
  status: string;
  updatedAt: string;
}