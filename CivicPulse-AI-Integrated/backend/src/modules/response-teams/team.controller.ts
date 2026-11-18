
import { Request, Response } from "express";
import {
  createTeamSchema,
  updateTeamSchema,
  teamMemberSchema
} from "./team.validation";

import {
  createTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember
} from "./team.service";

import ApiError from "../../utils/ApiError";

const getTeamId = (req: Request): string => {
  const id = req.params.id;

  if (typeof id !== "string") {
    throw new ApiError(400, "Invalid team ID");
  }

  return id;
};

export const createTeamController = async (
  req: Request,
  res: Response
) => {
  const result = createTeamSchema.safeParse(req.body);

  if (!result.success) {
    throw new ApiError(400, result.error.issues[0].message);
  }

  const team = await createTeam(result.data);

  return res.status(201).json({
    success: true,
    message: "Response team created successfully",
    team
  });
};

export const getAllTeamsController = async (
  req: Request,
  res: Response
) => {
  const teams = await getAllTeams();

  return res.status(200).json({
    success: true,
    count: teams.length,
    teams
  });
};

export const getTeamByIdController = async (
  req: Request,
  res: Response
) => {

  const teamId = getTeamId(req);
 

  const team = await getTeamById(teamId);
  

  return res.status(200).json({
    success: true,
    team
  });
};

export const updateTeamController = async (
  req: Request,
  res: Response
) => {
  const result = updateTeamSchema.safeParse(req.body);

  if (!result.success) {
    throw new ApiError(400, result.error.issues[0].message);
  }

  const team = await updateTeam(getTeamId(req), result.data);

  return res.status(200).json({
    success: true,
    message: "Team updated successfully",
    team
  });
};

export const deleteTeamController = async (
  req: Request,
  res: Response
) => {
  await deleteTeam(getTeamId(req));

  return res.status(200).json({
    success: true,
    message: "Team deleted successfully"
  });
};

export const addTeamMemberController = async (
  req: Request,
  res: Response
) => {
  const result = teamMemberSchema.safeParse(req.body);

  if (!result.success) {
    throw new ApiError(400, result.error.issues[0].message);
  }

  const team = await addTeamMember(
    getTeamId(req),
    result.data.userId
  );

  return res.status(200).json({
    success: true,
    message: "Team member added successfully",
    team
  });
};

export const removeTeamMemberController = async (
  req: Request,
  res: Response
) => {
  const result = teamMemberSchema.safeParse(req.body);

  if (!result.success) {
    throw new ApiError(400, result.error.issues[0].message);
  }

  const team = await removeTeamMember(
    getTeamId(req),
    result.data.userId
  );

  return res.status(200).json({
    success: true,
    message: "Team member removed successfully",
    team
  });
};
