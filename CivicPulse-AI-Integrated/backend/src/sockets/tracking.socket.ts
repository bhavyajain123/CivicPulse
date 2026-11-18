
import type { Server } from "socket.io";
import mongoose from "mongoose";
import Assignment from "../modules/assignments/assignment.model";

export interface TrackingPayload {
  teamId: string;
  incidentId: string;
  latitude: number;
  longitude: number;
  updatedAt: Date;
}

export const emitTrackingUpdate = async (
  io: Server,
  trackingData: TrackingPayload
): Promise<void> => {
  if (
    !mongoose.isValidObjectId(trackingData.teamId) ||
    !mongoose.isValidObjectId(trackingData.incidentId)
  ) {
    throw new Error("Invalid team or incident ID");
  }

  if (
    !Number.isFinite(trackingData.latitude) ||
    !Number.isFinite(trackingData.longitude) ||
    trackingData.latitude < -90 ||
    trackingData.latitude > 90 ||
    trackingData.longitude < -180 ||
    trackingData.longitude > 180
  ) {
    throw new Error("Invalid tracking coordinates");
  }

  const assignment = await Assignment.exists({
    teamId: trackingData.teamId,
    incidentId: trackingData.incidentId,
    status: {
      $in: ["assigned", "accepted", "in_progress"]
    }
  });

  if (!assignment) {
    throw new Error("No active assignment found");
  }

  io.to(`incident-${trackingData.incidentId}`).emit(
    "team-location-updated",
    trackingData
  );
  io.to("incident-dashboard").emit(
  "team-location-updated",
  trackingData
);
};
