
import mongoose from "mongoose";
import { z } from "zod";
import Team from "./team.model";
import User from "../users/user.model";
import Department from "../departments/department.model";
import {
  createTeamSchema,
  updateTeamSchema
} from "./team.validation";
import ApiError from "../../utils/ApiError";

export const createTeam = async (
  data: z.infer<typeof createTeamSchema>
) => {
  const department = await Department.findById(data.departmentId);

  if (!department) {
    throw new ApiError(404, "Department not found");
  }

  if (data.members?.length) {
    const validMembers = await User.countDocuments({
      _id: { $in: data.members },
      role: "response_team"
    });

    if (validMembers !== new Set(data.members).size) {
      throw new ApiError(400, "One or more members are invalid");
    }
  }

  return Team.create({
    name: data.name,
    departmentId: data.departmentId,
    members: data.members || []
  });
};

export const getAllTeams = async () => {
  return Team.find()
    .populate("departmentId", "name")
    .populate("members", "name email")
    .sort({ createdAt: -1 });
};

export const getTeamById = async (teamId: string) => {
  

  if (!mongoose.isValidObjectId(teamId)) {
    throw new ApiError(400, "Invalid team ID");
  }

 

  const team = await Team.findById(teamId)
    .populate("departmentId", "name")
    .populate("members", "name email")
    .lean();



  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  return team;
};
export const updateTeam = async (
  teamId: string,
  data: z.infer<typeof updateTeamSchema>
) => {
  if (!mongoose.isValidObjectId(teamId)) {
    throw new ApiError(400, "Invalid team ID");
  }

  if (data.departmentId) {
    const department = await Department.findById(data.departmentId);

    if (!department) {
      throw new ApiError(404, "Department not found");
    }
  }

  const team = await Team.findByIdAndUpdate(
    teamId,
    { $set: data },
    { new: true, runValidators: true }
  )
    .populate("departmentId", "name")
    .populate("members", "name email");

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  return team;
};

export const deleteTeam = async (teamId: string) => {
  if (!mongoose.isValidObjectId(teamId)) {
    throw new ApiError(400, "Invalid team ID");
  }

  const team = await Team.findById(teamId);

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  if (team.members.length > 0) {
    throw new ApiError(400, "Remove all members before deleting the team");
  }

  if (!team.isAvailable) {
    throw new ApiError(400, "Cannot delete a team currently on assignment");
  }

  const Assignment = mongoose.model("Assignment");

  const activeAssignment = await Assignment.exists({
    teamId,
    status: { $in: ["assigned", "accepted", "in_progress"] }
  });

  if (activeAssignment) {
    throw new ApiError(400, "Team has an active assignment");
  }

  await team.deleteOne();

  return team;
};

export const addTeamMember = async (
  teamId: string,
  userId: string
) => {
  if (!mongoose.isValidObjectId(teamId) ||
      !mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid team or user ID");
  }

  const [team, user] = await Promise.all([
    Team.findById(teamId),
    User.findById(userId)
  ]);

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  if (!user || user.role !== "response_team" || !user.isActive) {
    throw new ApiError(400, "Active response team member not found");
  }

  if (team.members.some((member) => member.toString() === userId)) {
    throw new ApiError(409, "User is already a team member");
  }

  team.members.push(user._id);
  await team.save();

  return Team.findById(teamId)
    .populate("departmentId", "name")
    .populate("members", "name email");
};

export const removeTeamMember = async (
  teamId: string,
  userId: string
) => {
  if (!mongoose.isValidObjectId(teamId) ||
      !mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid team or user ID");
  }

  const team = await Team.findById(teamId);

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  const memberExists = team.members.some(
    (member) => member.toString() === userId
  );

  if (!memberExists) {
    throw new ApiError(404, "Member not found in this team");
  }

  const Assignment = mongoose.model("Assignment");

  const activeAssignment = await Assignment.exists({
    teamId,
    status: { $in: ["assigned", "accepted", "in_progress"] }
  });

  if (activeAssignment) {
    throw new ApiError(
      400,
      "Cannot remove members while the team has an active assignment"
    );
  }

  team.members = team.members.filter(
    (member) => member.toString() !== userId
  );

  await team.save();

  return Team.findById(teamId)
    .populate("departmentId", "name")
    .populate("members", "name email");
};
