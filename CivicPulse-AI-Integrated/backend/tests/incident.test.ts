
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";

vi.mock("../src/modules/incidents/incident.service", () => ({
  createIncident: vi.fn(),
  getMyIncidents: vi.fn(),
  getAllIncidents: vi.fn(),
  updateIncidentStatus: vi.fn(),
  assignIncidentToTeam: vi.fn(),
  getAssignedIncidents: vi.fn(),
  resolveAssignedIncident: vi.fn(),
}));

import {
  createIncident,
  getMyIncidents,
  getAllIncidents,
  updateIncidentStatus,
  assignIncidentToTeam,
  getAssignedIncidents,
  resolveAssignedIncident,
} from "../src/modules/incidents/incident.service";

import {
  createIncidentController,
  getMyIncidentsController,
  getAllIncidentsController,
  updateIncidentStatusController,
  assignIncidentController,
  getAssignedIncidentsController,
  resolveAssignedIncidentController,
} from "../src/modules/incidents/incident.controller";

const mockResponse = () => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res as unknown as Response;
};

const incidentData = {
  title: "Fire Emergency",
  description: "Fire reported near the city market",
  category: "fire",
  location: {
    latitude: 28.6139,
    longitude: 77.209,
  },
};

const mockIncident = {
  _id: "507f1f77bcf86cd799439011",
  ...incidentData,
  status: "pending",
};

describe("Incident Controller Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create an incident successfully", async () => {
    vi.mocked(createIncident).mockResolvedValue(mockIncident as any);

    const req = {
      body: incidentData,
      user: { userId: "user123" },
      files: [],
    } as unknown as Request;

    const res = mockResponse();

    await createIncidentController(req, res);

    expect(createIncident).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("should reject invalid incident data", async () => {
    const req = {
      body: { title: "Bad" },
      user: { userId: "user123" },
      files: [],
    } as unknown as Request;

    const res = mockResponse();

    await createIncidentController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(createIncident).not.toHaveBeenCalled();
  });

  it("should reject incident creation without login", async () => {
    const req = {
      body: incidentData,
      files: [],
    } as unknown as Request;

    const res = mockResponse();

    await createIncidentController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(createIncident).not.toHaveBeenCalled();
  });

  it("should fetch citizen incidents", async () => {
    vi.mocked(getMyIncidents).mockResolvedValue([mockIncident] as any);

    const req = {
      user: { userId: "user123" },
    } as unknown as Request;

    const res = mockResponse();

    await getMyIncidentsController(req, res);

    expect(getMyIncidents).toHaveBeenCalledWith("user123");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should fetch all incidents", async () => {
    vi.mocked(getAllIncidents).mockResolvedValue([mockIncident] as any);

    const req = {} as Request;
    const res = mockResponse();

    await getAllIncidentsController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(getAllIncidents).toHaveBeenCalled();
  });

  it("should reject an invalid incident ID", async () => {
    const req = {
      params: { id: "invalid-id" },
      body: { status: "verified" },
    } as unknown as Request;

    const res = mockResponse();

    await updateIncidentStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(updateIncidentStatus).not.toHaveBeenCalled();
  });

  it("should update incident status successfully", async () => {
    vi.mocked(updateIncidentStatus).mockResolvedValue({
      ...mockIncident,
      status: "verified",
    } as any);

    const req = {
      params: { id: "507f1f77bcf86cd799439011" },
      body: { status: "verified" },
    } as unknown as Request;

    const res = mockResponse();

    await updateIncidentStatusController(req, res);

    expect(updateIncidentStatus).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should assign an incident to a response team", async () => {
    vi.mocked(assignIncidentToTeam).mockResolvedValue(mockIncident as any);

    const req = {
      params: { id: "507f1f77bcf86cd799439011" },
      body: { teamId: "507f1f77bcf86cd799439012" },
    } as unknown as Request;

    const res = mockResponse();

    await assignIncidentController(req, res);

    expect(assignIncidentToTeam).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should fetch assigned incidents for a response team", async () => {
    vi.mocked(getAssignedIncidents).mockResolvedValue([mockIncident] as any);

    const req = {
      user: { userId: "teamUser123" },
    } as unknown as Request;

    const res = mockResponse();

    await getAssignedIncidentsController(req, res);

    expect(getAssignedIncidents).toHaveBeenCalledWith("teamUser123");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should resolve an assigned incident", async () => {
    vi.mocked(resolveAssignedIncident).mockResolvedValue({
      ...mockIncident,
      status: "resolved",
    } as any);

    const req = {
      params: { id: "507f1f77bcf86cd799439011" },
      user: { userId: "teamUser123" },
    } as unknown as Request;

    const res = mockResponse();

    await resolveAssignedIncidentController(req, res);

    expect(resolveAssignedIncident).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
      "teamUser123"
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
