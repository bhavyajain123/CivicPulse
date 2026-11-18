
import mongoose from "mongoose";
import Assignment from "./assignment.model";
import Incident from "../incidents/incident.model";
import Team from "../response-teams/team.model";
import Department from "../departments/department.model";
import { getIO,sendNotification ,emitDashboardIncidentUpdate } from "../../sockets";

import {
  createAssignmentSchema,
  updateAssignmentStatusSchema
} from "./assignment.validation";

import {
  uploadImageBuffer,
  deleteImage
} from "../../integrations/cloudinary/cloudinary.client";

export const createAssignment = async (
  assignedBy: string,
  input: unknown
) => {
  const data = createAssignmentSchema.parse(input);
  const session = await mongoose.startSession();
try {
  let createdAssignment: unknown = null;

  await session.withTransaction(async () => {
const incident = await Incident.findById(
  data.incidentId
).session(session);

if (!incident) {
  throw new Error("Incident not found");
}

if (incident.status !== "verified") {
  throw new Error("Only verified incidents can be assigned");
}

if (incident.assignedTeam) {
  throw new Error("Incident is already assigned to a team");
}

      const team = await Team.findById(data.teamId).session(session);

      if (!team) throw new Error("Team not found");
      if (!team.isAvailable) throw new Error("Team is not available");
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


      const existingAssignment = await Assignment.findOne({
        incidentId: data.incidentId,
        status: { $in: ["assigned", "accepted", "in_progress"] }
      }).session(session);

      if (existingAssignment) {
        throw new Error("Incident already has an active assignment");
      }

      const [assignment] = await Assignment.create(
        [{
          incidentId: data.incidentId,
          teamId: data.teamId,
          assignedBy: new mongoose.Types.ObjectId(assignedBy),
          notes: data.notes
        }],
        { session }
      );

      incident.assignedTeam = team._id as mongoose.Types.ObjectId;
      incident.status = "assigned";
      await incident.save({ session });

      team.isAvailable = false;
      await team.save({ session });

      createdAssignment = assignment;
    });

    const assignment = createdAssignment as {
      incidentId: mongoose.Types.ObjectId;
      teamId: mongoose.Types.ObjectId;
    };
    emitDashboardIncidentUpdate(
  assignment.incidentId.toString()
);

    try {
      const team = await Team.findById(assignment.teamId)
        .select("members");

      if (team) {
        await Promise.all(
          team.members.map((member) =>
            sendNotification(member.toString(), {
              title: "New Incident Assigned",
              message: "Your team has been assigned a new incident.",
              type: "incident_assigned",
              incidentId: assignment.incidentId.toString()
            })
          )
        );
      }
    } catch (error) {
      console.error("Assignment notification error:", error);
    }

    return createdAssignment;
  } finally {
    await session.endSession();
  }
};

export const getAllAssignments = async () => {
  return Assignment.find()
    .populate("incidentId")
    .populate("teamId")
    .populate("assignedBy", "name email")
    .sort({ createdAt: -1 });
};

export const getTeamAssignments = async (teamId: string) => {
  return Assignment.find({ teamId })
    .populate("incidentId")
    .populate("teamId")
    .sort({ createdAt: -1 });
};

export const updateAssignmentStatus = async (
  assignmentId: string,
  teamId: string,
  input: unknown,
  files: Express.Multer.File[] = []
) => {
  const data = updateAssignmentStatusSchema.parse(input);
  const uploadedResolutionImages: {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
}[] = [];

if (data.status === "completed") {
  if (!data.resolutionRemarks?.trim()) {
    throw new Error("Resolution remarks are required");
  }

  try {
    for (const file of files) {
      const uploadedImage = await uploadImageBuffer(file.buffer);

      uploadedResolutionImages.push(uploadedImage);
    }
  } catch (error) {
    await Promise.allSettled(
      uploadedResolutionImages.map((image) =>
        deleteImage(image.publicId)
      )
    );

    throw error;
  }
}
  const session = await mongoose.startSession();

try {
  let updatedAssignment: unknown = null;

  try {
    await session.withTransaction(async () => {
      const assignment = await Assignment.findById(assignmentId).session(session);

      if (!assignment) throw new Error("Assignment not found");

      if (assignment.teamId.toString() !== teamId) {
        throw new Error("You are not authorized for this assignment");
      }

      const allowedTransitions: Record<string, string[]> = {
        assigned: ["accepted", "cancelled"],
        accepted: ["in_progress", "cancelled"],
        in_progress: ["completed"],
        completed: [],
        cancelled: []
      };

      if (!allowedTransitions[assignment.status].includes(data.status)) {
        throw new Error("Invalid assignment status transition");
      }

      assignment.status = data.status;
      if (data.status === "in_progress") {
  const incident = await Incident.findById(
    assignment.incidentId
  ).session(session);

  if (!incident) {
    throw new Error("Incident not found");
  }

  incident.status = "in_progress";

  await incident.save({ session });
}

      if (data.status === "accepted") {
        assignment.acceptedAt = new Date();
      }

      if (data.status === "completed") {
        assignment.completedAt = new Date();
      }

      if (data.notes !== undefined) {
        assignment.notes = data.notes;
      }

      await assignment.save({ session });

      if (data.status === "completed" || data.status === "cancelled") {
        const team = await Team.findById(assignment.teamId).session(session);

        if (team) {
          team.isAvailable = true;
          await team.save({ session });
        }

      if (data.status === "completed") {
  const incident = await Incident.findById(
    assignment.incidentId
  ).session(session);

  if (!incident) {
    throw new Error("Incident not found");
  }

  incident.status = "resolved";
  incident.resolutionRemarks = data.resolutionRemarks!.trim();

  incident.set(
    "resolutionImages",
    uploadedResolutionImages
  );

  incident.resolvedAt = assignment.completedAt ?? new Date();

  await incident.save({ session });

} else {
  await Incident.findByIdAndUpdate(
    assignment.incidentId,
    {
      status: "pending",
      assignedTeam: null
    },
    { session }
  );
}
      }

updatedAssignment = assignment;
});
} catch (error) {
  await Promise.allSettled(
    uploadedResolutionImages.map((image) =>
      deleteImage(image.publicId)
    )
  );

  throw error;
}

    const assignment = updatedAssignment as {
      status: string;
      incidentId: mongoose.Types.ObjectId;
      teamId: mongoose.Types.ObjectId;
    };
    emitDashboardIncidentUpdate(
  assignment.incidentId.toString()
);

    if (
      assignment.status === "completed" ||
      assignment.status === "cancelled"
    ) {
      const incidentId = assignment.incidentId.toString();
      const incidentRoom = `incident-${incidentId}`;
      const io = getIO();

      const team = await Team.findById(assignment.teamId)
        .select("members");

      if (team) {
        const memberIds = new Set(
          team.members.map((member) => member.toString())
        );

        const roomSockets = await io.in(incidentRoom).fetchSockets();

        await Promise.all(
          roomSockets.map(async (socket) => {
            const socketUser = socket.data.user as
              | { userId: string; role: string }
              | undefined;

            if (
              socketUser?.role === "response_team" &&
              memberIds.has(socketUser.userId)
            ) {
              socket.emit("incident-access-revoked", {
                incidentId,
                reason: assignment.status
              });

              await socket.leave(incidentRoom);
            }
          })
        );
      }
    }

    return updatedAssignment;
  } finally {
    await session.endSession();
  }
};
