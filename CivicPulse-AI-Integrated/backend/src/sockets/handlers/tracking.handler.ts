import mongoose from "mongoose";
import type { Server } from "socket.io";
import type {
  CivicSocket,
  SocketAck,
  IncidentLocationPayload
} from "../types";

import { EVENTS } from "../events";
import { rooms } from "../rooms";

import { isValidLocation } from "../validators/location.validator";

import Team from "../../modules/response-teams/team.model";
import Assignment from "../../modules/assignments/assignment.model";

import { updateTeamLocation } from "../../modules/response-teams/tracking.service";
import { emitTrackingUpdate } from "../tracking.socket";

const ACTIVE_STATUSES = [
  "assigned",
  "accepted",
  "in_progress"
];
export const trackingHandlers = (
  io: Server,
  socket: CivicSocket
): void => {
  const activeTracking = new Set<string>();

 
  socket.on(
    EVENTS.TRACKING_START,
    async (
      payload: { incidentId?: string },
      ack?: (result: SocketAck) => void
    ) => {
      try {
        const user = socket.data.user;

        if (user.role !== "response_team") {
          ack?.({
            ok: false,
            code: "FORBIDDEN",
            message: "Only response team members can start tracking"
          });
          return;
        }

        const incidentId = payload?.incidentId;

        if (
          !incidentId ||
          !mongoose.isValidObjectId(incidentId)
        ) {
          ack?.({
            ok: false,
            code: "INVALID_ID",
            message: "Invalid incident ID"
          });
          return;
        }
        const team = await Team.findOne({
          members: user.userId
        }).select("_id");

        if (!team) {
          ack?.({
            ok: false,
            code: "TEAM_NOT_FOUND",
            message: "Response team not found"
          });
          return;
        }

        const assignment = await Assignment.findOne({
          incidentId,
          teamId: team._id,
          status: { $in: ACTIVE_STATUSES }
        }).select("_id");

        if (!assignment) {
          ack?.({
            ok: false,
            code: "NO_ACTIVE_ASSIGNMENT",
            message: "No active assignment exists for this incident"
          });
          return;
        }

        activeTracking.add(incidentId);

        await socket.join(rooms.incident(incidentId));

        ack?.({
          ok: true,
          message: "Incident tracking started"
        });

      } catch (error) {
        console.error("Tracking start error:", error);

        ack?.({
          ok: false,
          code: "TRACKING_START_FAILED",
          message: "Unable to start tracking"
        });
      }
    }
  );

 
  socket.on(
    EVENTS.TRACKING_LOCATION,
    async (
      payload: IncidentLocationPayload,
      ack?: (result: SocketAck) => void
    ) => {
      try {
        if (socket.data.user.role !== "response_team") {
          ack?.({
            ok: false,
            code: "FORBIDDEN",
            message: "Response team authentication required"
          });
          return;
        }

        if (!isValidLocation(payload)) {
          ack?.({
            ok: false,
            code: "INVALID_LOCATION",
            message: "Invalid GPS coordinates"
          });
          return;
        }

        if (!activeTracking.has(payload.incidentId)) {
          ack?.({
            ok: false,
            code: "TRACKING_NOT_STARTED",
            message: "Start tracking before sending GPS updates"
          });
          return;
        }

      
        const location = await updateTeamLocation(
          socket.data.user.userId,
          {
            incidentId: payload.incidentId,
            latitude: payload.latitude,
            longitude: payload.longitude
          }
        );

      
        await emitTrackingUpdate(io, location);

        socket.to(
          rooms.incident(payload.incidentId)
        ).emit(EVENTS.TRACKING_UPDATED, {
          ...location,
          userId: socket.data.user.userId,
          timestamp: new Date(location.updatedAt).toISOString()
        });

        ack?.({
          ok: true,
          message: "GPS location updated successfully",
          data: location
        });

      } catch (error) {
        console.error("Tracking location error:", error);

        ack?.({
          ok: false,
          code: "LOCATION_UPDATE_FAILED",
          message: error instanceof Error
            ? error.message
            : "Unable to update GPS location"
        });
      }
    }
  );

  socket.on(
    EVENTS.TRACKING_STOP,
    (
      payload: { incidentId?: string },
      ack?: (result: SocketAck) => void
    ) => {
      const incidentId = payload?.incidentId;

      if (
        !incidentId ||
        !mongoose.isValidObjectId(incidentId)
      ) {
        ack?.({
          ok: false,
          code: "INVALID_ID",
          message: "Invalid incident ID"
        });
        return;
      }

      activeTracking.delete(incidentId);

      ack?.({
        ok: true,
        message: "GPS tracking stopped"
      });
    }
  );

  socket.on("disconnect", () => {
    activeTracking.clear();
  });
};