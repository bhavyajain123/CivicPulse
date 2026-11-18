import { Request, Response } from "express";
import {  geocodeAddress,reverseGeocode } from "../../integrations/maps/maps.service";

import {
  createIncidentSchema,
  incidentIdSchema,
  updateIncidentStatusSchema,
  assignIncidentSchema
} from "./incident.validation";

import {
  createIncident,
  getMyIncidents,
  getAllIncidents,
  updateIncidentStatus,
  assignIncidentToTeam,
  getAssignedIncidents,
  startAssignedIncident,
  resolveAssignedIncident,
  addResolutionPhotos,
  getIncidentTimeline
} from "./incident.service";

import { AuthRequest } from "../../middlewares/auth.middleware";

export const createIncidentController = async (
  req: Request,
  res: Response
) => {
  try {
    const body = { ...req.body };

   
    if (typeof body.location === "string") {
      try {
        body.location = JSON.parse(body.location);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid location format"
        });
      }
    }

   
    if (!body.location) {
      const latitude =
        body["location.latitude"] ??
        body["location[latitude]"];

      const longitude =
        body["location.longitude"] ??
        body["location[longitude]"];

      if (latitude !== undefined && longitude !== undefined) {
        body.location = { latitude, longitude };
      }
    }

    let resolvedAddress: string | null = null;

if (typeof body.locationAddress === "string") {
  const address = body.locationAddress.trim();

  if (!address) {
    return res.status(400).json({
      success: false,
      message: "Incident location is required"
    });
  }

  try {
    const geocodedLocation = await geocodeAddress(address);

    if (!geocodedLocation) {
      return res.status(422).json({
        success: false,
        message: "Location not found. Please enter a more specific address."
      });
    }

    body.location = geocodedLocation.coordinates;
    resolvedAddress = geocodedLocation.formattedAddress;

  } catch (error) {
    console.error("Address geocoding error:", error);

    return res.status(502).json({
      success: false,
      message: "Unable to find this location. Please try again."
    });
  }
}

    const result = createIncidentSchema.safeParse(body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0].message
      });
    }

    const userId = (req as AuthRequest).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first"
      });
    }

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];

let formattedAddress: string | null = resolvedAddress;

if (!formattedAddress) {
  try {
    const locationDetails = await reverseGeocode(
      result.data.location.latitude,
      result.data.location.longitude
    );

    formattedAddress = locationDetails?.formattedAddress ?? null;

  } catch (error) {
    console.error("OpenStreetMap geocoding error:", error);
  }
}
const incidentData = {
  ...result.data,
  location: {
    ...result.data.location,
    address: formattedAddress ?? ""
  }
};

const incident = await createIncident(
  incidentData,
  userId,
  files
);

    return res.status(201).json({
      success: true,
      message: "Incident reported successfully",
      incident
    });

  } catch (error) {
    console.error("Create incident error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while reporting incident"
    });
  }
};

export const getMyIncidentsController= async(
    req:Request,
    res:Response
)=>{
    try{
        const userId= (req as AuthRequest).user?.userId;
        if(!userId){
            return res.status(401).json({
                success:false,
                message:"please login first"
            });
        }
        const incidents= await getMyIncidents(userId);
        return res.status(200).json({
            success:true,
            message:"your incidents fetched successfully",
            count:incidents.length,
            incidents
        });
    }catch(error){
        console.error("get incident error:", error);
        return res.status(500).json({
            success:false,
            message:"something went wrong"
        });
    }
};

export const getAllIncidentsController= async(
    req:Request,
    res:Response
)=>{
    try{
        const incidents= await getAllIncidents();
        
        return res.status(200).json({
            success:true,
            message:"all incidents fetched successful",
            count:incidents.length,
            incidents
        });
    }catch(error){
        console.error("get all incidents error:", error);
        return res.status(500).json({
            success:false,
            message:"failed to fetch incidents"
        });
    }
};

export const updateIncidentStatusController = async (
  req: Request,
  res: Response
) => {
  try {

    const idResult= incidentIdSchema.safeParse(req.params.id);
    if(!idResult.success){
        return res.status(400).json({
            success:false,
            message:"invalid incident id"
        });
    }
    const result = updateIncidentStatusSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0].message
      });
    }

const userId = (req as AuthRequest).user?.userId;

const incident = await updateIncidentStatus(
  String(req.params.id),
  result.data,
  userId
);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Incident updated successfully",
      incident
    });

  } catch (error) {
    console.error("Update incident error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
};

export const assignIncidentController= async(
    req:Request,
    res:Response
)=>{
    try{

        const idResult = incidentIdSchema.safeParse(req.params.id);

if (!idResult.success) {
  return res.status(400).json({
    success: false,
    message: "Invalid incident ID"
  });
}
        const result= assignIncidentSchema.safeParse(req.body);

        if(!result.success){
            return res.status(400).json({
                success:false,
                message:result.error.issues[0].message
            });
        }
const userId = (req as AuthRequest).user?.userId;

const incident = await assignIncidentToTeam(
  String(req.params.id),
  result.data.teamId,
  userId
);
        return res.status(200).json({
            success:true,
            message:"response team assigned successfully",
            incident
        });
    }catch(error){
        console.error("assign incident error:", error);

        if(error instanceof Error){
            if(error.message=== "response team not found"){
                return res.status(404).json({
                    success:false,
                    message:error.message
                });
            }
            if (
  error.message === "Only verified incidents can be assigned" ||
  error.message.includes("belongs to")
) {
  return res.status(409).json({
    success: false,
    message: error.message
  });
}

            if(error.message=== "response team not available"){
                return res.status(409).json({
                    success:false,
                    message:error.message
                });
            }
        }
        return res.status(500).json({
            success:false,
            message:"something went wrong"
        });
    }
};

export const getAssignedIncidentsController= async(
    req:Request,
    res:Response
)=>{
    try{
        const userId= (req as AuthRequest).user?.userId;

        if(!userId){
            return res.status(401).json({
                success:false,
                message:"please login first"
            });
        }
        const incidents= await getAssignedIncidents(userId);

        return res.status(200).json({
            success:true,
            message:"assigned incidents fetched successfully",
            count:incidents.length,
            incidents
        });
    }catch(error){
        console.error("get assigned incidents error",error);

        return res.status(500).json({
            success:false,
            message:"something went wrong"
        });
    }

    
};

export const startAssignedIncidentController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    const idResult = incidentIdSchema.safeParse(req.params.id);

    if (!idResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid incident ID"
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first"
      });
    }

    const incident = await startAssignedIncident(
      idResult.data,
      userId
    );

    return res.status(200).json({
      success: true,
      message: "Incident work started successfully",
      incident
    });

  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Something went wrong";

    if (
      message === "incident not found" ||
      message === "Assigned team not found"
    ) {
      return res.status(404).json({
        success: false,
        message
      });
    }

    if (
      message === "Active response team member not found" ||
      message === "You are not a member of this response team"
    ) {
      return res.status(403).json({
        success: false,
        message
      });
    }

    if (
      message === "Only assigned incidents can be started" ||
      message === "This incident is not assigned to any team"
    ) {
      return res.status(409).json({
        success: false,
        message
      });
    }

    console.error("Start incident error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to start incident"
    });
  }
};

export const resolveAssignedIncidentController= async(
    req:Request,
    res:Response
)=>{
    try{
        const userId=(req as AuthRequest).user?.userId;
        const id = req.params.id as string;
        const idResult = incidentIdSchema.safeParse(id);

if (!idResult.success) {
  return res.status(400).json({
    success: false,
    message: "Invalid incident ID"
  });
}
        if(!userId){
            return res.status(401).json({
                success:false,
                message:"please login first"
            });
        }
        const incident= await resolveAssignedIncident(id, userId);
        return res.status(200).json({
            success:true,
            message:"incident resolved successfully",
            incident
        });
    }catch(error){
        const message= error instanceof Error
        ? error.message
        :"something went wrong";

        const statusCode= 
        message ==="incident not found" ||
        message==="assigned team not found"
        ?404
        :403;

        return res.status(statusCode).json({
            success:false,
            message

        });
    }
};
export const addResolutionPhotosController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as AuthRequest).user?.userId;

    const idResult = incidentIdSchema.safeParse(req.params.id);

    if (!idResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid incident ID"
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first"
      });
    }

    const files =
      (req.files as Express.Multer.File[] | undefined) ?? [];

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one resolution photo"
      });
    }

    const incident = await addResolutionPhotos(
      idResult.data,
      userId,
      files
    );

    return res.status(200).json({
      success: true,
      message: "Resolution photos uploaded successfully",
      incident
    });

  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to upload resolution photos";

    const statusCode =
      message === "incident not found" ? 404 :
      message.includes("not a member") ? 403 :
      message.includes("Only resolved") ||
      message.includes("maximum of 5") ? 409 :
      500;

    return res.status(statusCode).json({
      success: false,
      message
    });
  }
};

export const getIncidentTimelineController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    const idResult = incidentIdSchema.safeParse(req.params.id);

    if (!idResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid incident ID"
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first"
      });
    }

    const timeline = await getIncidentTimeline(
      idResult.data,
      userId
    );

    return res.status(200).json({
      success: true,
      message: "Incident timeline fetched successfully",
      timeline
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Something went wrong";

    if (message === "incident not found") {
      return res.status(404).json({
        success: false,
        message
      });
    }

    if (message === "You are not authorized to view this incident") {
      return res.status(403).json({
        success: false,
        message
      });
    }

    console.error("Incident timeline error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch incident timeline"
    });
  }
};