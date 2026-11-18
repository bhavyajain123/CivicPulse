import {
  io,
  type Socket
} from "socket.io-client";

import type {
  ServerToClientEvents,
  ClientToServerEvents
} from "./socket/socket.types";

export type CivicSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;
let socket: CivicSocket | null = null;
let connectedToken: string | null = null;
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const socketService = {

  connect: (token: string): CivicSocket => {

  
    if (socket && connectedToken === token) {
      return socket;
    }

    if (socket && connectedToken !== token) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }

    connectedToken = token;

socket = io(
  SOCKET_URL,
  {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  }
) as CivicSocket;
    return socket;
  },

  disconnect: (): void => {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }

    connectedToken = null;
  },

  getSocket: (): CivicSocket | null => {
    return socket;
  },

  isConnected: (): boolean => {
    return socket?.connected ?? false;
  }
};