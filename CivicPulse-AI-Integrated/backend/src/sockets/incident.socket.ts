
import type { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import Incident from "../modules/incidents/incident.model";
import Team from "../modules/response-teams/team.model";
import Assignment from "../modules/assignments/assignment.model";

const isValidId = (id: unknown): id is string =>
  typeof id === "string" &&
  mongoose.isValidObjectId(id);

export const registerIncidentSocket = (
  io: Server,
  socket: Socket
): void => {
  socket.on("join-incident", async (incidentId: unknown) => {
    if (!isValidId(incidentId)) {
      socket.emit("socket-error", {
        message: "Invalid incident ID"
      });
      return;
    }

    try {
      const user = socket.data.user as
        | { userId: string; role: string }
        | undefined;

      if (!user) {
        socket.emit("socket-error", {
          message: "Authentication required"
        });
        return;
      }

      const incident = await Incident.findById(incidentId)
        .select("reportedBy assignedTeam");

      if (!incident) {
        socket.emit("socket-error", {
          message: "Incident not found"
        });
        return;
      }

      let allowed =
        user.role === "admin" ||
        user.role === "operator" ||
        incident.reportedBy.toString() === user.userId;

      if (!allowed && user.role === "response_team") {
        const team = await Team.findOne({
          _id: incident.assignedTeam,
          members: user.userId
        }).select("_id");

        if (team) {
          allowed = Boolean(
            await Assignment.exists({
              teamId: team._id,
              incidentId,
              status: {
                $in: ["assigned", "accepted", "in_progress"]
              }
            })
          );
        }
      }

      if (!allowed) {
        socket.emit("socket-error", {
          message: "Access denied"
        });
        return;
      }

      await socket.join(`incident-${incidentId}`);

      socket.emit("incident-joined", { incidentId });
    } catch (error) {
      console.error("Join incident socket error:", error);

      socket.emit("socket-error", {
        message: "Unable to join incident"
      });
    }
  });

  socket.on("leave-incident", async (incidentId: unknown) => {
    if (!isValidId(incidentId)) return;

    await socket.leave(`incident-${incidentId}`);
  });
};

export const emitIncidentEvent = (
  io: Server,
  incidentId: string,
  event: string,
  data: unknown
): void => {
  if (!isValidId(incidentId)) {
    throw new Error("Invalid incident ID");
  }

  io.to(`incident-${incidentId}`).emit(event, data);
};
