import mongoose from "mongoose";
import { z } from "zod";
import Incident from "./incident.model";
import { createIncidentSchema } from "./incident.validation";
import Team from "../response-teams/team.model";
import User from "../users/user.model";
import Department from "../departments/department.model";
import { sendNotification , emitDashboardIncidentUpdate} from "../../sockets";
import {
  uploadImageBuffer,
  deleteImage
} from "../../integrations/cloudinary/cloudinary.client";

export type CreateIncidentInput = {
  title: string;
  description: string;
  category: "fire" | "accident" | "medical" | "crime" | "other";
  location: {
    latitude: number;
    longitude: number;
  };
};

export const createIncident = async (
  data: z.infer<typeof createIncidentSchema>,
  userId: string,
  files: Express.Multer.File[] = []
) => {
  const uploadedImages: {
    url: string;
    publicId: string;
    format: string;
    width: number;
    height: number;
  }[] = [];


  try {
    for (const file of files) {
      const image = await uploadImageBuffer(file.buffer);
      uploadedImages.push(image);
    }
  } catch (error) {
    
    await Promise.allSettled(
      uploadedImages.map((image) => deleteImage(image.publicId))
    );

    throw error;
  }

 
  let incident;

  try {
  incident = await Incident.create({
  ...data,
  reportedBy: userId,
  images: uploadedImages,
  statusHistory: [
    {
      status: "pending",
      message: "Incident reported successfully",
      updatedBy: userId,
      timestamp: new Date()
    }
  ]
});
  } catch (error) {
    await Promise.allSettled(
      uploadedImages.map((image) => deleteImage(image.publicId))
    );

    throw error;
  }

   
  try {
    const users = await User.find({
      role: { $in: ["admin", "operator"] },
      isActive: true
    }).select("_id");

    await Promise.all(
      users.map((user) =>
        sendNotification(user._id.toString(), {
          title: "New Incident Reported",
          message: `A new incident "${incident.title}" has been reported.`,
          type: "new_incident",
          incidentId: incident._id.toString()
        })
      )
    );
  } catch (error) {
    console.error("Incident notification error:", error);
  }
    emitDashboardIncidentUpdate(incident._id.toString());
  return incident;
};


export const getMyIncidents = async (userId: string) => {
  return Incident.find({
    reportedBy: userId
  })
    .populate("reportedBy", "name email")
    .populate({
      path: "assignedTeam",
      select: "name isAvailable currentLocation"
    })
    .sort({ createdAt: -1 });
};


export const getAllIncidents = async () => {
  return Incident.find()
    .populate("reportedBy", "name email")
    .populate("assignedTeam", "name")
    .sort({ createdAt: -1 });
};

export const updateIncidentStatus = async (
  incidentId: string,
  data: {
    status?:
      | "pending"
      | "verified"
      | "assigned"
      | "in_progress"
      | "resolved";
    priority?: "low" | "medium" | "high" | "critical";
  },
  userId?: string
) => {
  const incident = await Incident.findById(incidentId);

  if (!incident) {
    throw new Error("incident not found");
  }

  const previousStatus = incident.status;

  if (data.status && data.status !== previousStatus) {
    incident.status = data.status;

    incident.statusHistory.push({
      status: data.status,
      message: `Incident status changed from ${previousStatus.replace("_", " ")} to ${data.status.replace("_", " ")}`,
      updatedBy: userId ?? null,
      timestamp: new Date()
    } as any);
  }

  if (data.priority) {
    incident.priority = data.priority;
  }

  await incident.save();

  emitDashboardIncidentUpdate(incident._id.toString());

  return incident;
};


export const assignIncidentToTeam = async (
  incidentId: string,
  teamId: string,
  userId?: string
) => {
  const session = await mongoose.startSession();

  let assignedIncident: any = null;
  let teamMembers: string[] = [];

  try {
await session.withTransaction(async () => {
  const team = await Team.findById(teamId).session(session);

  if (!team) {
    throw new Error("response team not found");
  }

  if (!team.isAvailable) {
    throw new Error("response team not available");
  }

  const incident = await Incident.findById(incidentId).session(session);

  if (!incident) {
    throw new Error("incident not found");
  }

  if (incident.status !== "verified") {
    throw new Error("Only verified incidents can be assigned");
  }

  const departmentMapping: Record<string, string> = {
    fire: "Fire Department",
    accident: "Traffic Management",
    medical: "Medical Department",
    crime: "Security & Law Enforcement"
  };

  const requiredDepartment = departmentMapping[incident.category];

  if (requiredDepartment) {
    const department = await Department.findById(
      team.departmentId
    ).select("name").session(session);

    if (
      !department ||
      department.name.trim().toLowerCase() !==
        requiredDepartment.toLowerCase()
    ) {
      throw new Error(
        `This incident belongs to ${requiredDepartment}. Please select a matching response team.`
      );
    }
  }

team.isAvailable = false;
await team.save({ session });

incident.assignedTeam = team._id;
incident.status = "assigned";
incident.statusHistory.push({
  status: "assigned",
  message: `Response team ${team.name} assigned to incident`,
  updatedBy: userId ?? null,
  timestamp: new Date()
} as any);

await incident.save({ session });

  assignedIncident = incident;
  teamMembers = team.members.map((member) => member.toString());
});
  } finally {
    await session.endSession();
  }

  try {
    await Promise.all(
      teamMembers.map((memberId) =>
        sendNotification(memberId, {
          title: "New Incident Assigned",
          message: `Your team has been assigned incident: ${assignedIncident.title}`,
          type: "incident_assigned",
          incidentId: assignedIncident._id.toString()
        })
      )
    );
  } catch (error) {
    console.error("Assignment notification error:", error);
  }

  if (assignedIncident) {
    emitDashboardIncidentUpdate(
      assignedIncident._id.toString()
    );
  }

  return assignedIncident;
};

export const getAssignedIncidents = async (userId: string) => {
  const teams = await Team.find({
    members: userId
  }).select("_id");

  const teamIds = teams.map((team) => team._id);

  return Incident.find({
    assignedTeam: { $in: teamIds }
  })
    .populate("assignedTeam", "name")
    .sort({ createdAt: -1 });

    
};

export const startAssignedIncident = async (
  incidentId: string,
  userId: string
) => {
  const session = await mongoose.startSession();

  let startedIncident: any = null;

  try {
    await session.withTransaction(async () => {
     
      const user = await User.findOne({
        _id: userId,
        role: "response_team",
        isActive: true
      }).session(session);

      if (!user) {
        throw new Error("Active response team member not found");
      }

      
      const incident = await Incident.findById(incidentId)
        .session(session);

      if (!incident) {
        throw new Error("incident not found");
      }

      if (!incident.assignedTeam) {
        throw new Error("This incident is not assigned to any team");
      }

 
      const team = await Team.findById(incident.assignedTeam)
        .session(session);

      if (!team) {
        throw new Error("Assigned team not found");
      }

  
      const isMember = team.members.some(
        (member) => member.toString() === userId
      );

      if (!isMember) {
        throw new Error(
          "You are not a member of this response team"
        );
      }

      if (incident.status !== "assigned") {
        throw new Error(
          "Only assigned incidents can be started"
        );
      }

      
incident.status = "in_progress";

incident.statusHistory.push({
  status: "in_progress",
  message: "Response team has started working on the incident",
  updatedBy: userId,
  timestamp: new Date()
} as any);

await incident.save({ session });

      startedIncident = incident;
    });
  } finally {
    await session.endSession();
  }

 
  try {
await sendNotification(
  startedIncident.reportedBy.toString(),
  {
    title: "Incident Work Started",
    message: "The response team has started working on your incident.",
    type: "incident_in_progress",
    incidentId: startedIncident._id.toString()
  }
);
  } catch (error) {
    console.error("Start incident notification error:", error);
  }

  emitDashboardIncidentUpdate(
    startedIncident._id.toString()
  );

  return startedIncident;
};



export const resolveAssignedIncident = async (
  incidentId: string,
  userId: string
) => {
  const session = await mongoose.startSession();

  let resolvedIncident: any = null;

  try {
    await session.withTransaction(async () => {
      const incident = await Incident.findById(incidentId).session(session);

      if (!incident) {
        throw new Error("incident not found");
      }

      if (!incident.assignedTeam) {
        throw new Error("this incident is not assigned to any team");
      }

      const team = await Team.findById(incident.assignedTeam).session(session);

      if (!team) {
        throw new Error("Assigned team not found");
      }

      const isMember = team.members.some(
        (member) => member.toString() === userId
      );

      if (!isMember) {
        throw new Error("You are not a member of this response team");
      }

      if (incident.status !== "assigned") {
        throw new Error("Only assigned incidents can be resolved");
      }

incident.status = "resolved";
incident.resolvedAt = new Date();
team.isAvailable = true;

incident.statusHistory.push({
  status: "resolved",
  message: "Incident resolved by response team",
  updatedBy: userId,
  timestamp: new Date()
} as any);

await incident.save({ session });
await team.save({ session });

      resolvedIncident = incident;
    });
  } finally {
    await session.endSession();
  }

  try {
    await sendNotification(resolvedIncident.reportedBy.toString(), {
      title: "Incident Resolved",
      message: `Your reported incident "${resolvedIncident.title}" has been resolved.`,
      type: "incident_resolved",
      incidentId: resolvedIncident._id.toString()
    });
  } catch (error) {
    console.error("Resolution notification error:", error);
  }
  if (resolvedIncident) {
    emitDashboardIncidentUpdate(
      resolvedIncident._id.toString()
    );
  }

  return resolvedIncident;
};




export const addResolutionPhotos = async (
  incidentId: string,
  userId: string,
  files: Express.Multer.File[]
) => {
 
  if (!files || files.length === 0) {
    throw new Error("Please select at least one resolution photo");
  }


  const user = await User.findOne({
    _id: userId,
    role: "response_team",
    isActive: true
  }).select("_id");

  if (!user) {
    throw new Error("Active response team member not found");
  }


  const incident = await Incident.findById(incidentId);

  if (!incident) {
    throw new Error("incident not found");
  }

  
  if (incident.status !== "resolved") {
    throw new Error(
      "Only resolved incidents can receive resolution photos"
    );
  }

  if (!incident.assignedTeam) {
    throw new Error("This incident is not assigned to any team");
  }

  
  const team = await Team.findById(
    incident.assignedTeam
  ).select("members");

  if (!team) {
    throw new Error("Assigned team not found");
  }


  const isMember = team.members.some(
    (member) => member.toString() === userId
  );

  if (!isMember) {
    throw new Error(
      "You are not a member of this response team"
    );
  }

 
  const existingImages =
    (incident.get("resolutionImages") as unknown[] | undefined) ?? [];

  if (existingImages.length + files.length > 5) {
    throw new Error(
      "A maximum of 5 resolution photos is allowed"
    );
  }

  const uploadedImages: {
    url: string;
    publicId: string;
    format: string;
    width: number;
    height: number;
  }[] = [];

 
  try {
    for (const file of files) {
      const uploadedImage = await uploadImageBuffer(file.buffer);

      uploadedImages.push(uploadedImage);
    }
  } catch (error) {
    await Promise.allSettled(
      uploadedImages.map((image) =>
        deleteImage(image.publicId)
      )
    );

    throw error;
  }

  
  let updatedIncident;

  try {
    updatedIncident = await Incident.findOneAndUpdate(
      {
        _id: incidentId,
        status: "resolved",
        assignedTeam: incident.assignedTeam,
        $expr: {
          $lte: [
            {
              $size: {
                $ifNull: ["$resolutionImages", []]
              }
            },
            5 - uploadedImages.length
          ]
        }
      },
      {
        $push: {
          resolutionImages: {
            $each: uploadedImages
          }
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedIncident) {
      const latestIncident = await Incident.findById(
        incidentId
      ).select("status resolutionImages");

      if (!latestIncident) {
        throw new Error("incident not found");
      }

      if (latestIncident.status !== "resolved") {
        throw new Error(
          "Only resolved incidents can receive resolution photos"
        );
      }

      throw new Error(
        "Maximum of 5 resolution photos is allowed or incident was updated. Please refresh and try again."
      );
    }
  } catch (error) {
    await Promise.allSettled(
      uploadedImages.map((image) =>
        deleteImage(image.publicId)
      )
    );

    throw error;
  }

  
  try {
    emitDashboardIncidentUpdate(
      updatedIncident._id.toString()
    );
  } catch (error) {
    console.error("Resolution photo update notification error:", error);
  }

  return updatedIncident;
};

export const getIncidentTimeline = async (
  incidentId: string,
  userId: string
) => {
  const incident = await Incident.findById(incidentId);

  if (!incident) {
    throw new Error("incident not found");
  }

  const user = await User.findById(userId).select("role");

  if (!user) {
    throw new Error("You are not authorized to view this incident");
  }

  let isAuthorized = false;

  // Citizen: only own incident
  if (
    user.role === "citizen" &&
    incident.reportedBy.toString() === userId
  ) {
    isAuthorized = true;
  }

  // Admin and operator
  if (user.role === "admin" || user.role === "operator") {
    isAuthorized = true;
  }

  // Response team: only incidents assigned to their team
  if (user.role === "response_team" && incident.assignedTeam) {
    const team = await Team.findById(incident.assignedTeam).select("members");

    if (
      team &&
      team.members.some((member) => member.toString() === userId)
    ) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    throw new Error("You are not authorized to view this incident");
  }

  const timeline = incident.statusHistory ?? [];

  return timeline
    .slice()
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() -
        new Date(b.timestamp).getTime()
    );
};