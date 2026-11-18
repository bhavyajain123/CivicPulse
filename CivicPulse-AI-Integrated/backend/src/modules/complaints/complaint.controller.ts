
import type { Response } from "express";
import type { AuthRequest } from "../../types/auth.types";
import * as complaintService from "./complaint.service";

export const createComplaint = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const complaint = await complaintService.createComplaint(
      req.user!.userId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      data: complaint
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error
        ? error.message
        : "Unable to submit complaint"
    });
  }
};

export const getMyComplaints = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const complaints = await complaintService.getMyComplaints(
      req.user!.userId
    );

    return res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error
        ? error.message
        : "Unable to fetch complaints"
    });
  }
};

export const getAllComplaints = async (
  _req: AuthRequest,
  res: Response
) => {
  try {
    const complaints = await complaintService.getAllComplaints();

    return res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch complaints"
    });
  }
};

export const getComplaintById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const complaint = await complaintService.getComplaintById(
      String(req.params.id),
      req.user!.userId,
      req.user!.role
    );

    return res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Unable to fetch complaint";

    return res.status(
      message === "Complaint not found" ? 404 :
      message.includes("authorized") ? 403 : 400
    ).json({
      success: false,
      message
    });
  }
};


export const updateComplaint = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const complaint = await complaintService.updateComplaint(
      String(req.params.id),
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Complaint updated successfully",
      data: complaint
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Unable to update complaint";

    const statusCode =
      message === "Complaint not found" ? 404 :
      message === "Invalid complaint ID" ? 400 :
      message === "Closed complaint cannot be updated" ? 400 :
      message === "Invalid complaint status transition" ? 400 :
      message === "Resolution remarks are required to close a complaint" ? 400 :
      message.includes("Assigned user") ? 400 :
      message.includes("assigned user ID") ? 400 :
      500;

    return res.status(statusCode).json({
      success: false,
      message
    });
  }
};

export const assignComplaintController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const complaint = await complaintService.assignComplaint(
      String(req.params.id),
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Complaint assigned successfully",
      data: complaint
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Unable to assign complaint";

    const status =
      message === "Complaint not found" ? 404 :
      message.includes("Invalid") ? 400 :
      message.includes("Closed") ? 400 :
      message.includes("under review") ? 400 :
      message.includes("active member") ? 400 : 400;

    return res.status(status).json({
      success: false,
      message
    });
  }
};

export const getAssignedComplaintsController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const complaints = await complaintService.getAssignedComplaints(
      req.user!.userId
    );

    return res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error
        ? error.message
        : "Unable to fetch assigned complaints"
    });
  }
};

export const updateAssignedComplaintController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const complaint = await complaintService.updateAssignedComplaint(
      String(req.params.id),
      req.user!.userId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Assigned complaint updated successfully",
      data: complaint
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Unable to update assigned complaint";

    const status =
      message === "Complaint not found" ? 404 :
      message.includes("not assigned") ? 403 :
      message.includes("Invalid") ? 400 :
      message.includes("remarks") ? 400 :
      message.includes("transition") ? 400 : 400;

    return res.status(status).json({
      success: false,
      message
    });
  }
};


