
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";

vi.mock("../src/modules/response-teams/team.service", () => ({
  createTeam: vi.fn(),
  getAllTeams: vi.fn(),
  getTeamById: vi.fn(),
  updateTeam: vi.fn(),
  deleteTeam: vi.fn(),
  addTeamMember: vi.fn(),
  removeTeamMember: vi.fn(),
}));

import {
  createTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
} from "../src/modules/response-teams/team.service";

import {
  createTeamController,
  getAllTeamsController,
  getTeamByIdController,
  updateTeamController,
  deleteTeamController,
  addTeamMemberController,
  removeTeamMemberController,
} from "../src/modules/response-teams/team.controller";

const mockResponse = () => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res as unknown as Response;
};

const teamId = "507f1f77bcf86cd799439011";
const departmentId = "507f1f77bcf86cd799439012";
const userId = "507f1f77bcf86cd799439013";

const mockTeam = {
  _id: teamId,
  name: "Fire Rescue Team",
  departmentId,
  members: [userId],
  isAvailable: true,
};

describe("Team Controller Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a team successfully", async () => {
    vi.mocked(createTeam).mockResolvedValue(mockTeam as any);

    const req = {
      body: {
        name: "Fire Rescue Team",
        departmentId,
        members: [userId],
      },
    } as Request;

    const res = mockResponse();

    await createTeamController(req, res);

    expect(createTeam).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("should reject invalid team data", async () => {
    const req = {
      body: {
        name: "AB",
        departmentId: "invalid-id",
      },
    } as Request;

    const res = mockResponse();

    await expect(createTeamController(req, res)).rejects.toMatchObject({
      statusCode: 400,
    });

    expect(createTeam).not.toHaveBeenCalled();
  });

  it("should fetch all teams", async () => {
    vi.mocked(getAllTeams).mockResolvedValue([mockTeam] as any);

    const req = {} as Request;
    const res = mockResponse();

    await getAllTeamsController(req, res);

    expect(getAllTeams).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should fetch a team by ID", async () => {
    vi.mocked(getTeamById).mockResolvedValue(mockTeam as any);

    const req = {
      params: { id: teamId },
    } as unknown as Request;

    const res = mockResponse();

    await getTeamByIdController(req, res);

    expect(getTeamById).toHaveBeenCalledWith(teamId);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should update a team successfully", async () => {
    vi.mocked(updateTeam).mockResolvedValue({
      ...mockTeam,
      name: "Updated Fire Team",
    } as any);

    const req = {
      params: { id: teamId },
      body: { name: "Updated Fire Team" },
    } as unknown as Request;

    const res = mockResponse();

    await updateTeamController(req, res);

    expect(updateTeam).toHaveBeenCalledWith(
      teamId,
      { name: "Updated Fire Team" }
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should delete a team successfully", async () => {
    vi.mocked(deleteTeam).mockResolvedValue(undefined as any);

    const req = {
      params: { id: teamId },
    } as unknown as Request;

    const res = mockResponse();

    await deleteTeamController(req, res);

    expect(deleteTeam).toHaveBeenCalledWith(teamId);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should add a team member", async () => {
    vi.mocked(addTeamMember).mockResolvedValue(mockTeam as any);

    const req = {
      params: { id: teamId },
      body: { userId },
    } as unknown as Request;

    const res = mockResponse();

    await addTeamMemberController(req, res);

    expect(addTeamMember).toHaveBeenCalledWith(teamId, userId);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should remove a team member", async () => {
    vi.mocked(removeTeamMember).mockResolvedValue(mockTeam as any);

    const req = {
      params: { id: teamId },
      body: { userId },
    } as unknown as Request;

    const res = mockResponse();

    await removeTeamMemberController(req, res);

    expect(removeTeamMember).toHaveBeenCalledWith(teamId, userId);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
