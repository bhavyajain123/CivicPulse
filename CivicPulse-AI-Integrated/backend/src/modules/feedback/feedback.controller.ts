import {Response} from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";

import { createFeedback, getMyFeedback, getAllFeedback, updateFeedbackStatus } from "./feedback.service";

export const createFeedbackController= async(
    req:AuthRequest,
    res:Response
)=>{
    try{
        const feedback= await createFeedback(
            req.user!.userId,
            req.body
        );
        return res.status(201).json({
            success:true,
            message:"feedback submited successfully",
            feedback
        });
    }catch(error){
         const message =
      error instanceof Error ? error.message : "Failed to submit feedback";

    const status = message === "Incident not found" ? 404 :
      message.includes("already submitted") ? 409 :
      message.includes("only be submitted") ? 400 :
      message.includes("validation") ? 400 : 500;

    return res.status(status).json({
      success: false,
      message
         });
    }
};
export const getMyFeedbackController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const feedback = await getMyFeedback(req.user!.userId);

    return res.status(200).json({
      success: true,
      count: feedback.length,
      feedback
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your feedback"
    });
  }
};
export const getAllFeedbackController= async(
    req:AuthRequest,
    res:Response
)=>{
    try{
        const feedback= await getAllFeedback();
        return res.status(200).json({
            success:true,
            count:feedback.length,
            feedback
        });
    }catch{
        return res.status(500).json({
            success:false,
            message:"failed to fetch feedback"
        });
    }
};
export const updateFeedbackStatusController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const feedback = await updateFeedbackStatus(
      req.params.id as string,
      req.body
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Feedback status updated successfully",
      feedback
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update feedback";

    return res.status(400).json({
      success: false,
      message
    });
  }
};