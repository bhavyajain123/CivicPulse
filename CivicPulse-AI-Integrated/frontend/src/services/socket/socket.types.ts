export interface SocketAck {
  ok: boolean;
  message?: string;
  code?: string;
  data?: unknown;
}

export interface CivicNotification {
  _id?: string;
  userId?: string;
  title: string;
  message: string;
  type?: string;
  incidentId?: string;
  isRead?: boolean;
  createdAt?: string;
}


export interface IncidentLocationPayload {
  incidentId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

export interface TeamLocationPayload {
  teamId: string;
  incidentId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export interface TrackingUpdatePayload extends TeamLocationPayload {
  userId: string;
  timestamp: string;
}


export interface ComplaintStatusPayload {
  complaintId: string;
  status: string;
  updatedAt?: string;
  note?: string;
}

export interface PresencePayload {
  userId: string;
  online: boolean;
  updatedAt?: string;
}


export interface ServerToClientEvents {
  "new-notification": (payload: CivicNotification) => void;

  "incident-updated": (payload: {
    incidentId: string;
    updatedAt: string;
  }) => void;

  "incident-joined": (payload: {
    incidentId: string;
  }) => void;

  "team-location-updated": (
    payload: TeamLocationPayload
  ) => void;

  "team-location-saved": (payload: {
    success: boolean;
    message: string;
    location: TeamLocationPayload;
  }) => void;

  "incident-access-revoked": (payload: {
    incidentId: string;
    reason: string;
  }) => void;

  "socket-error": (payload: {
    message: string;
    code?: string;
  }) => void;

  "tracking:updated": (
    payload: TrackingUpdatePayload
  ) => void;

  "complaint:updated": (payload: unknown) => void;

  "complaint:status-changed": (
    payload: ComplaintStatusPayload
  ) => void;

  "dispatch:team-assigned": (payload: unknown) => void;

  "presence:update": (
    payload: PresencePayload
  ) => void;

  "system:pong": (payload: {
    timestamp: number;
  }) => void;
}

export interface ClientToServerEvents {
  "join-incident": (incidentId: string) => void;

  "leave-incident": (incidentId: string) => void;

  "update-team-location": (
    payload: IncidentLocationPayload
  ) => void;

  "complaint:join": (
    payload: { complaintId: string },
    ack?: (result: SocketAck) => void
  ) => void;

  "complaint:leave": (
    payload: { complaintId: string },
    ack?: (result: SocketAck) => void
  ) => void;

  "tracking:start": (
    payload: { incidentId: string },
    ack?: (result: SocketAck) => void
  ) => void;

  "tracking:location": (
    payload: IncidentLocationPayload,
    ack?: (result: SocketAck) => void
  ) => void;

  "tracking:stop": (
    payload: { incidentId: string },
    ack?: (result: SocketAck) => void
  ) => void;

  "presence:get": (
    payload: { userIds: string[] },
    ack?: (result: SocketAck) => void
  ) => void;

  "system:ping": (
    ack?: (result: SocketAck) => void
  ) => void;
}