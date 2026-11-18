
import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  createAssignment,
  getAllAssignments,
  getTeamAssignments,
  updateAssignmentStatus
} from "./assignment.service";
import Team from "../response-teams/team.model";


export const createAssignmentController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const assignedBy = req.user!.userId;

    const assignment = await createAssignment(assignedBy, req.body);

    return res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      assignment
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create assignment";

const status = message.includes("not found") ? 404 :
  message.includes("already") ||
  message.includes("not available") ||
  message.includes("cannot be assigned") ||
  message.includes("Only verified") ||
  message.includes("belongs to") ? 409 :
  message.includes("validation") ? 400 : 500;

    return res.status(status).json({
      success: false,
      message
    });
  }
};


export const getAllAssignmentsController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const assignments = await getAllAssignments();

    return res.status(200).json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assignments"
    });
  }
};


export const getMyTeamAssignmentsController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.userId;

    const team = await Team.findOne({ members: userId });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "No response team found for this user"
      });
    }

    const assignments = await getTeamAssignments(team._id.toString());

    return res.status(200).json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch team assignments"
    });
  }
};


export const updateAssignmentStatusController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.userId;
    const assignmentId = req.params.id as string;

    const team = await Team.findOne({ members: userId });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "No response team found for this user"
      });
    }
const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const assignment = await updateAssignmentStatus(
      assignmentId,
      team._id.toString(),
      req.body
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assignment status updated successfully",
      assignment
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update assignment";

    const status = message.includes("not found") ? 404 :
      message.includes("not authorized") ? 403 :
      message.includes("Invalid") ? 400 : 500;

    return res.status(status).json({
      success: false,
      message
    });
  }
};
