import mongoose from "mongoose";
import Complaint from "../../modules/complaints/complaint.model";
import type { CivicSocket, SocketAck } from "../types";
import { rooms } from "../rooms";
import { EVENTS } from "../events";

const getComplaintId = (payload: unknown): string | null => {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("complaintId" in payload)
  ) {
    return null;
  }

  const complaintId = payload.complaintId;

  return typeof complaintId === "string"
    ? complaintId.trim()
    : null;
};

const canViewComplaint = async (
  socket: CivicSocket,
  complaintId: string
): Promise<boolean> => {
  const complaint = await Complaint.findById(complaintId)
    .select("userId assignedTo");

  if (!complaint) return false;

  const user = socket.data.user;

 
  if (user.role === "admin" || user.role === "operator") {
    return true;
  }

 
  if (complaint.userId.toString() === user.userId) {
    return true;
  }

 
  if (complaint.assignedTo?.toString() === user.userId) {
    return true;
  }

  return false;
};

export const complaintHandlers = (
  socket: CivicSocket
): void => {

 
  socket.on(
    EVENTS.JOIN_COMPLAINT,
    async (
      payload: unknown,
      ack?: (result: SocketAck) => void
    ) => {
      try {
        const complaintId = getComplaintId(payload);

        if (
          !complaintId ||
          !mongoose.isValidObjectId(complaintId)
        ) {
          ack?.({
            ok: false,
            code: "INVALID_ID",
            message: "Invalid complaint ID"
          });
          return;
        }

        const allowed = await canViewComplaint(
          socket,
          complaintId
        );

        if (!allowed) {
          ack?.({
            ok: false,
            code: "FORBIDDEN",
            message: "You are not authorized to view this complaint"
          });
          return;
        }

        await socket.join(rooms.complaint(complaintId));

        ack?.({
          ok: true,
          message: "Complaint room joined successfully"
        });

      } catch (error) {
        console.error("Complaint join error:", error);

        ack?.({
          ok: false,
          code: "JOIN_FAILED",
          message: "Unable to join complaint room"
        });
      }
    }
  );

  
  socket.on(
    EVENTS.LEAVE_COMPLAINT,
    async (
      payload: unknown,
      ack?: (result: SocketAck) => void
    ) => {
      try {
        const complaintId = getComplaintId(payload);

        if (
          !complaintId ||
          !mongoose.isValidObjectId(complaintId)
        ) {
          ack?.({
            ok: false,
            code: "INVALID_ID",
            message: "Invalid complaint ID"
          });
          return;
        }

        await socket.leave(rooms.complaint(complaintId));

        ack?.({
          ok: true,
          message: "Complaint room left successfully"
        });

      } catch (error) {
        console.error("Complaint leave error:", error);

        ack?.({
          ok: false,
          code: "LEAVE_FAILED",
          message: "Unable to leave complaint room"
        });
      }
    }
  );
};