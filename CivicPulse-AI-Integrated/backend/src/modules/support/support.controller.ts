import type { Request, Response } from "express";

import {
  createSupportRequest,
  getAllSupportRequests,
  getSupportRequestById,
  updateSupportRequestStatus
} from "./support.service";

const validCategories = [
  "Technical issue",
  "Incident workflow",
  "Account access",
  "Other request"
] as const;

const validStatuses = [
  "open",
  "in_progress",
  "resolved"
] as const;



export const createSupportRequestController = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, category, message } = req.body;

    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }

    if (
      typeof category !== "string" ||
      !validCategories.includes(
        category as (typeof validCategories)[number]
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid support category"
      });
    }

    if (
      typeof message !== "string" ||
      message.trim().length < 8 ||
      message.trim().length > 3000
    ) {
      return res.status(400).json({
        success: false,
        message: "Message must contain 8 to 3000 characters"
      });
    }

    const supportRequest = await createSupportRequest({
      email: email.trim().toLowerCase(),
      category: category as (typeof validCategories)[number],
      message: message.trim()
    });

    return res.status(201).json({
      success: true,
      message: "Support request submitted successfully",
      supportRequest
    });

  } catch (error) {
    console.error("Create support request error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit support request"
    });
  }
};

export const getAllSupportRequestsController = async (
  req: Request,
  res: Response
) => {
  try {
    const supportRequests = await getAllSupportRequests();

    return res.status(200).json({
      success: true,
      count: supportRequests.length,
      supportRequests
    });

  } catch (error) {
    console.error("Get support requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch support requests"
    });
  }
};


export const getSupportRequestByIdController = async (
  req: Request,
  res: Response
) => {
  try {
 const rawId = req.params.id;
const id = Array.isArray(rawId) ? rawId[0] : rawId;

if (typeof id !== "string" || !id.trim()) {
  return res.status(400).json({
    success: false,
    message: "Invalid support request ID"
  });
}

const supportRequest = await getSupportRequestById(id);
    if (!supportRequest) {
      return res.status(404).json({
        success: false,
        message: "Support request not found"
      });
    }

    return res.status(200).json({
      success: true,
      supportRequest
    });

  } catch (error) {
    console.error("Get support request error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch support request"
    });
  }
};



export const updateSupportRequestStatusController = async (
  req: Request,
  res: Response
) => {
  try {
const rawId = req.params.id;
const id = Array.isArray(rawId) ? rawId[0] : rawId;

const { status } = req.body;

if (typeof id !== "string" || !id.trim()) {
  return res.status(400).json({
    success: false,
    message: "Invalid support request ID"
  });
}

    if (
      typeof status !== "string" ||
      !validStatuses.includes(
        status as (typeof validStatuses)[number]
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid support request status"
      });
    }

    const supportRequest = await updateSupportRequestStatus(
      id,
      status as (typeof validStatuses)[number]
    );

    if (!supportRequest) {
      return res.status(404).json({
        success: false,
        message: "Support request not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Support request status updated successfully",
      supportRequest
    });

  } catch (error) {
    console.error("Update support request error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update support request"
    });
  }
};