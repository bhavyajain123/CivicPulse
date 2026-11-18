import type { Server } from "socket.io";
import { rooms } from "../rooms";
let io: Server | null = null;
export const setSocketIO = (server: Server): void => {
  io =server;
};

const getIO = (): Server => {
  if (!io){
    throw new Error("Socket.IO is not initialized");
  }

  return io;
};

export const socketService = {
  toUser(
    userId: string,
    event: string,
    payload: unknown
  ): void {
    getIO().to(rooms.user(userId)).emit(event, payload);
  },

  toIncident(
    incidentId: string,
    event: string,
    payload: unknown
  ): void {
    getIO().to(rooms.incident(incidentId)).emit(event, payload);
  },

  toDashboard(
    event: string,
    payload: unknown
  ): void {
    getIO().to(rooms.dashboard).emit(event, payload);
  },

  toComplaint(
    complaintId: string,
    event: string,
    payload: unknown
  ): void {
    getIO().to(rooms.complaint(complaintId)).emit(event, payload);
  },

  toDepartment(
    departmentId: string,
    event: string,
    payload: unknown
  ): void {
    getIO().to(rooms.department(departmentId)).emit(event, payload);
  },

  toTeam(
    teamId: string,
    event: string,
    payload: unknown
  ): void {
    getIO().to(rooms.team(teamId)).emit(event, payload);
  },

  toRoom(
    room: string,
    event: string,
    payload: unknown
  ): void {
    getIO().to(room).emit(event, payload);
  }

};