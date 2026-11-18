
import mongoose from "mongoose";
import Team from "./team.model";
import User from "../users/user.model";
import Assignment from "../assignments/assignment.model";
import ApiError from "../../utils/ApiError";

interface LocationInput {
  incidentId: string;
  latitude: number;
  longitude: number;
}

export const updateTeamLocation = async (
  userId: string,
  input: LocationInput
) => {
  if (
    !mongoose.isValidObjectId(userId) ||
    !mongoose.isValidObjectId(input.incidentId)
  ) {
    throw new ApiError(400, "Invalid user or incident ID");
  }

  if (
    !Number.isFinite(input.latitude) ||
    !Number.isFinite(input.longitude) ||
    input.latitude < -90 ||
    input.latitude > 90 ||
    input.longitude < -180 ||
    input.longitude > 180
  ) {
    throw new ApiError(400, "Invalid location coordinates");
  }

  const user = await User.findById(userId).select(
    "_id role isActive"
  );

  if (!user || !user.isActive || user.role !== "response_team") {
    throw new ApiError(403, "Active response team member required");
  }


  const activeAssignments = await Assignment.find({
    incidentId: input.incidentId,
    status: {
      $in: ["assigned", "accepted", "in_progress"]
    }
  }).select("teamId");

  if (activeAssignments.length === 0) {
    throw new ApiError(403, "No active assignment for this incident");
  }
  const assignedTeamIds = activeAssignments.map(
    assignment => assignment.teamId
  );

  const team = await Team.findOne({
    _id: { $in: assignedTeamIds },
    members: user._id
  });

  if (!team) {
    throw new ApiError(
      403,
      "You are not a member of the assigned response team"
    );
  }

  const updatedAt = new Date();

  team.currentLocation = {
    latitude: input.latitude,
    longitude: input.longitude,
    updatedAt
  };

  await team.save();

  return {
    teamId: team._id.toString(),
    incidentId: input.incidentId,
    latitude: input.latitude,
    longitude: input.longitude,
    updatedAt
  };
};
