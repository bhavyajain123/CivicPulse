import { Server, type Socket } from "socket.io";
import type { Server as HTTPServer } from "http";

import jwt from "jsonwebtoken";

import type { CivicSocket, IncidentLocationPayload } from "./types";

import { authenticateSocket } from "./auth.middleware";
import { attachSocketRateLimiter } from "./rate-limit.middleware";

import { rooms, userRooms } from "./rooms";
import { EVENTS } from "./events";

import { registerIncidentSocket } from "./incident.socket";
import { emitTrackingUpdate } from "./tracking.socket";

import { complaintHandlers } from "./handlers/complaint.handler";
import { trackingHandlers } from "./handlers/tracking.handler";
import { presenceHandlers } from "./handlers/presence.handler";

import { presenceService } from "./services/presence.service";
import { setSocketIO } from "./services/socket.service";

import { updateTeamLocation } from "../modules/response-teams/tracking.service";
import Team from "../modules/response-teams/team.model";

import { createNotification } from "../modules/notifications/notification.service";
import type { NotificationType } from "../modules/notifications/notification.model";

import socketConfig from "../config/socket.config";

let io: Server | null = null;



export const initializeSocket = (
  httpServer: HTTPServer
): Server => {

  io = new Server(httpServer, socketConfig);

 
  setSocketIO(io);

 
  io.use((socket, next) => {
    authenticateSocket(socket as Socket, next);
  });



  io.on("connection", async (rawSocket) => {

    const socket = rawSocket as unknown as CivicSocket;

    const userId = socket.data.user.userId;
    const userRole = socket.data.user.role;

    console.log(
      `User connected: ${userId} | Role: ${userRole} | Socket: ${socket.id}`
    );


    attachSocketRateLimiter(socket as Socket);

  
    const assignedRooms = userRooms(socket.data.user);

   
    if (userRole === "admin" || userRole === "operator") {
      assignedRooms.push(rooms.dashboard);
    }

    await Promise.all(
      assignedRooms.map((room) => socket.join(room))
    );



    const teamRoomNames: string[] = [];

    if (userRole === "response_team") {
      try {
        const teams = await Team.find({
          members: userId
        }).select("_id departmentId");

        for (const team of teams) {
          const teamId = team._id.toString();
          const departmentId = team.departmentId.toString();

          const teamRoom = rooms.team(teamId);
          const departmentRoom = rooms.department(departmentId);

          teamRoomNames.push(teamRoom);

          await Promise.all([
            socket.join(teamRoom),
            socket.join(departmentRoom)
          ]);
        }

      } catch (error) {
        console.error(
          "Unable to join response team rooms:",
          error
        );
      }
    }



    presenceService.connect(userId, socket.id);

    const presenceData = {
      userId,
      online: true,
      updatedAt: new Date().toISOString()
    };

  
    socket.to(rooms.role(userRole)).emit(
      EVENTS.PRESENCE_UPDATE,
      presenceData
    );

  
    if (userRole !== "admin" && userRole !== "operator") {
      io!.to(rooms.dashboard).emit(
        EVENTS.PRESENCE_UPDATE,
        presenceData
      );
    }

    // Notify response team members.
    for (const teamRoom of teamRoomNames) {
      socket.to(teamRoom).emit(
        EVENTS.PRESENCE_UPDATE,
        presenceData
      );
    }


    registerIncidentSocket(
      io!,
      socket as unknown as Socket
    );



    complaintHandlers(socket);



    trackingHandlers(io!, socket);



    presenceHandlers(socket);



    socket.on(
  EVENTS.UPDATE_TEAM_LOCATION,
  async (data: IncidentLocationPayload) => {

      try {
        const user = socket.data.user;
        if (user.role !== "response_team") {
          socket.emit(EVENTS.SOCKET_ERROR, {
            message: "Response team authentication required"
          });

          return;
        }

        const location = await updateTeamLocation(
          user.userId,
          data
        );

        await emitTrackingUpdate(io!, location);

        socket.emit(EVENTS.TEAM_LOCATION_SAVED, {
          success: true,
          message: "Team location updated successfully",
          location
        });

      } catch (error) {
        socket.emit(EVENTS.SOCKET_ERROR, {
          message: error instanceof Error
            ? error.message
            : "Unable to update team location"
        });
      }
    });



    socket.on(EVENTS.PING, (ack?: (result: { ok: boolean }) => void) => {

      socket.emit(EVENTS.PONG, {
        timestamp: Date.now()
      });

      ack?.({ ok: true });
    });



    socket.on("disconnect", () => {

      const becameOffline = presenceService.disconnect(
        userId,
        socket.id
      );

      console.log(
        `User disconnected: ${userId} | Socket: ${socket.id}`
      );

      if (!becameOffline) return;

      const offlineData = {
        userId,
        online: false,
        updatedAt: new Date().toISOString()
      };

      io!.to(rooms.role(userRole)).emit(
        EVENTS.PRESENCE_UPDATE,
        offlineData
      );

      io!.to(rooms.dashboard).emit(
        EVENTS.PRESENCE_UPDATE,
        offlineData
      );

      for (const teamRoom of teamRoomNames) {
        io!.to(teamRoom).emit(
          EVENTS.PRESENCE_UPDATE,
          offlineData
        );
      }
    });

  });

  console.log("CivicPulse Socket.IO initialized successfully");

  return io;
};


export const getIO = (): Server => {

  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
};



export const emitDashboardIncidentUpdate = (
  incidentId: string
): void => {

  if (!io) return;

  const update = {
    incidentId,
    updatedAt: new Date().toISOString()
  };

  io.to(rooms.dashboard).emit(
    EVENTS.INCIDENT_UPDATED,
    update
  );

  io.to(rooms.incident(incidentId)).emit(
    EVENTS.INCIDENT_UPDATED,
    update
  );
};


export const sendNotification = async (
  userId: string,
  notification: {
    title: string;
    message: string;
    type: NotificationType;
    incidentId?: string;
  }
) => {


  const savedNotification = await createNotification({
    userId,
    ...notification
  });

  
  getIO().to(rooms.user(userId)).emit(
    EVENTS.NEW_NOTIFICATION,
    savedNotification
  );

  return savedNotification;
};