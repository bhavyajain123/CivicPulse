
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";

vi.mock("../src/modules/assignments/assignment.service", () => ({
  createAssignment: vi.fn(),
  getAllAssignments: vi.fn(),
  getTeamAssignments: vi.fn(),
  updateAssignmentStatus: vi.fn(),
}));

vi.mock("../src/modules/response-teams/team.model", () => ({
  default: {
    findOne: vi.fn(),
  },
}));

import {
  createAssignment,
  getAllAssignments,
  getTeamAssignments,
  updateAssignmentStatus,
} from "../src/modules/assignments/assignment.service";

import Team from "../src/modules/response-teams/team.model";

import {
  createAssignmentController,
  getAllAssignmentsController,
  getMyTeamAssignmentsController,
  updateAssignmentStatusController,
} from "../src/modules/assignments/assignment.controller";

const mockResponse = () => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res as unknown as Response;
};

const incidentId = "507f1f77bcf86cd799439011";
const teamId = "507f1f77bcf86cd799439012";
const assignmentId = "507f1f77bcf86cd799439013";
const userId = "507f1f77bcf86cd799439014";

const mockAssignment = {
  _id: assignmentId,
  incidentId,
  teamId,
  status: "assigned",
  notes: "Emergency response",
};

const mockTeam = {
  _id: { toString: () => teamId },
  members: [userId],
};

describe("Assignment Controller Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create an assignment successfully", async () => {
    vi.mocked(createAssignment).mockResolvedValue(mockAssignment as any);

    const req = {
      user: { userId },
      body: { incidentId, teamId, notes: "Emergency response" },
    } as any;

    const res = mockResponse();

    await createAssignmentController(req, res);

    expect(createAssignment).toHaveBeenCalledWith(userId, req.body);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("should return 404 when incident or team is not found", async () => {
    vi.mocked(createAssignment).mockRejectedValue(
      new Error("Incident not found")
    );

    const req = {
      user: { userId },
      body: { incidentId, teamId },
    } as any;

    const res = mockResponse();

    await createAssignmentController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should return 409 when assignment conflicts", async () => {
    vi.mocked(createAssignment).mockRejectedValue(
      new Error("Team is not available")
    );

    const req = {
      user: { userId },
      body: { incidentId, teamId },
    } as any;

    const res = mockResponse();

    await createAssignmentController(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("should fetch all assignments", async () => {
    vi.mocked(getAllAssignments).mockResolvedValue([mockAssignment] as any);

    const req = { user: { userId } } as any;
    const res = mockResponse();

    await getAllAssignmentsController(req, res);

    expect(getAllAssignments).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should fetch assignments for a response team", async () => {
    vi.mocked(Team.findOne).mockResolvedValue(mockTeam as any);
    vi.mocked(getTeamAssignments).mockResolvedValue([mockAssignment] as any);

    const req = { user: { userId } } as any;
    const res = mockResponse();

    await getMyTeamAssignmentsController(req, res);

    expect(Team.findOne).toHaveBeenCalledWith({ members: userId });
    expect(getTeamAssignments).toHaveBeenCalledWith(teamId);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should return 404 when user has no response team", async () => {
    vi.mocked(Team.findOne).mockResolvedValue(null as any);

    const req = { user: { userId } } as any;
    const res = mockResponse();

    await getMyTeamAssignmentsController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(getTeamAssignments).not.toHaveBeenCalled();
  });

  it("should update assignment status successfully", async () => {
    vi.mocked(Team.findOne).mockResolvedValue(mockTeam as any);

    vi.mocked(updateAssignmentStatus).mockResolvedValue({
      ...mockAssignment,
      status: "accepted",
    } as any);

    const req = {
      user: { userId },
      params: { id: assignmentId },
      body: { status: "accepted" },
    } as any;

    const res = mockResponse();

    await updateAssignmentStatusController(req, res);

    expect(updateAssignmentStatus).toHaveBeenCalledWith(
      assignmentId,
      teamId,
      { status: "accepted" }
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should reject status update when user has no response team", async () => {
    vi.mocked(Team.findOne).mockResolvedValue(null as any);

    const req = {
      user: { userId },
      params: { id: assignmentId },
      body: { status: "accepted" },
    } as any;

    const res = mockResponse();

    await updateAssignmentStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(updateAssignmentStatus).not.toHaveBeenCalled();
  });

  it("should return 404 when assignment does not exist", async () => {
    vi.mocked(Team.findOne).mockResolvedValue(mockTeam as any);
    vi.mocked(updateAssignmentStatus).mockResolvedValue(null as any);

    const req = {
      user: { userId },
      params: { id: assignmentId },
      body: { status: "accepted" },
    } as any;

    const res = mockResponse();

    await updateAssignmentStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should reject invalid assignment status transition", async () => {
    vi.mocked(Team.findOne).mockResolvedValue(mockTeam as any);

    vi.mocked(updateAssignmentStatus).mockRejectedValue(
      new Error("Invalid assignment status transition")
    );

    const req = {
      user: { userId },
      params: { id: assignmentId },
      body: { status: "completed" },
    } as any;

    const res = mockResponse();

    await updateAssignmentStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
