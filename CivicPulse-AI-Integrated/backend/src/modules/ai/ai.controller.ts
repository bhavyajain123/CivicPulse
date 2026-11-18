import {Response} from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { analyzeIncident } from "./ai.service";
import { checkDuplicateIncidents } from "./ai.service";
import { recommendResponseTeams } from "./ai.service";

export const analyzeIncidentController= async(
    req:AuthRequest,
    res:Response
)=>{
    try{
        const analysis= await analyzeIncident(req.body);

        return res.status(200).json({
            success:true,
            message:"incident analysis complted successfully",
            analysis
        });
    } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI analysis failed";

    const isValidationError =
      error instanceof Error && error.name === "ZodError";

    const isTemporaryError =
  /temporarily unavailable|503|high demand|service unavailable/i.test(message);

    return res.status(
      isValidationError ? 400 : isTemporaryError ? 503 : 500
    ).json({
      success: false,
      message
    });
  }
    };
export const checkDuplicatesController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const result = await checkDuplicateIncidents(req.body);

return res.status(200).json({
  success: true,
  ...result
});
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Duplicate detection failed.";

    const isValidationError =
      error instanceof Error &&
      error.name === "ZodError";

    const isTemporaryError =
      /temporarily unavailable|503|high demand|service unavailable/i.test(
        message
      );

    return res.status(
      isValidationError ? 400 : isTemporaryError ? 503 : 500
    ).json({
      success: false,
      message
    });
  }
};


export const recommendTeamsController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const result = await recommendResponseTeams(req.body);

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Team recommendation failed";

    const isValidationError =
      error instanceof Error && error.name === "ZodError";

    const isTemporaryError =
      /temporarily unavailable|503|high demand|service unavailable/i.test(
        message
      );

    return res.status(
      isValidationError ? 400 : isTemporaryError ? 503 : 500
    ).json({
      success: false,
      message
    });
  }
};

import { predictComplaintWithML, findMLDuplicateCandidates, getMLModelInfo } from "./ml-ai.service";

export const mlPredictController = async (req: AuthRequest, res: Response) => {
  try {
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (text.length < 5 || text.length > 5000) return res.status(400).json({ success: false, message: "Complaint text must be between 5 and 5000 characters." });
    const prediction = await predictComplaintWithML(text);
    return res.status(200).json({ success: true, prediction });
  } catch (error) {
    return res.status(503).json({ success: false, message: error instanceof Error ? error.message : "ML prediction service unavailable" });
  }
};

export const mlDuplicatesController = async (req: AuthRequest, res: Response) => {
  try {
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (text.length < 5 || text.length > 5000) return res.status(400).json({ success: false, message: "Complaint text must be between 5 and 5000 characters." });
    const result = await findMLDuplicateCandidates(text);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(503).json({ success: false, message: error instanceof Error ? error.message : "ML duplicate service unavailable" });
  }
};

export const mlModelInfoController = async (_req: AuthRequest, res: Response) => {
  try { return res.status(200).json({ success: true, ...(await getMLModelInfo()) }); }
  catch (error) { return res.status(503).json({ success: false, message: error instanceof Error ? error.message : "ML service unavailable" }); }
};
