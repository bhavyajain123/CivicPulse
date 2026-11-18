import mongoose from "mongoose";
import type { CivicSocket, SocketAck } from "../types";
import { EVENTS } from "../events";
import { presenceService } from "../services/presence.service";
import Team from "../../modules/response-teams/team.model";

export const presenceHandlers = (
  socket: CivicSocket
): void => {

  socket.on(
    EVENTS.PRESENCE_GET,
    async (
      payload: { userIds?: string[] },
      ack?: (result: SocketAck) => void
    ) => {
      try {
        const requestedIds = payload?.userIds;

        if (
          !Array.isArray(requestedIds) ||
          requestedIds.length > 100 ||
          !requestedIds.every(
            id =>
              typeof id === "string" &&
              mongoose.isValidObjectId(id)
          )
        ) {
          ack?.({
            ok: false,
            code: "INVALID_REQUEST",
            message: "Invalid presence request"
          });
          return;
        }

        const user = socket.data.user;
        let authorizedIds: string[] = [];
       
        if (
          user.role === "admin" ||
          user.role === "operator"
        ) {
          authorizedIds = requestedIds;
        }

        
        else if (user.role === "response_team") {
          const teams = await Team.find({
            members: user.userId
          }).select("members");

          const memberIds = new Set(
            teams.flatMap(team =>
              team.members.map(member => member.toString())
            )
          );

          authorizedIds = requestedIds.filter(
            id => memberIds.has(id)
          );
        }

       
        else if (user.role === "citizen") {
          authorizedIds = requestedIds.filter(
            id => id === user.userId
          );
        }

        const onlineUsers = presenceService.online(
          authorizedIds
        );

        ack?.({
          ok: true,
          data: onlineUsers
        });

      } catch (error) {
        console.error("Presence lookup error:", error);

        ack?.({
          ok: false,
          code: "PRESENCE_FAILED",
          message: "Unable to retrieve user presence"
        });
      }
    }
  );
};