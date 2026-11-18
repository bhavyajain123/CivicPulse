
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";

vi.mock("../src/modules/complaints/complaint.service", () => ({
  createComplaint: vi.fn(),
  getMyComplaints: vi.fn(),
  getAllComplaints: vi.fn(),
  getComplaintById: vi.fn(),
  updateComplaint: vi.fn(),
}));

import * as complaintService from "../src/modules/complaints/complaint.service";

import {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintById,
  updateComplaint,
} from "../src/modules/complaints/complaint.controller";

const mockResponse = () => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res as unknown as Response;
};

const complaintData = {
  title: "Water Supply Problem",
  description: "Water supply unavailable for two days.",
  category: "water",
};

const mockComplaint = {
  _id: "507f1f77bcf86cd799439011",
  ...complaintData,
  status: "submitted",
};

describe("Complaint Controller Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a complaint successfully", async () => {
    vi.mocked(complaintService.createComplaint)
      .mockResolvedValue(mockComplaint as any);

    const req = {
      body: complaintData,
      user: { userId: "user123", role: "citizen" },
    } as unknown as Request;

    const res = mockResponse();

    await createComplaint(req as any, res);

    expect(complaintService.createComplaint)
      .toHaveBeenCalledWith("user123", complaintData);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("should reject invalid complaint data", async () => {
    vi.mocked(complaintService.createComplaint)
      .mockRejectedValue(new Error("Invalid complaint data"));

    const req = {
      body: { title: "Bad" },
      user: { userId: "user123", role: "citizen" },
    } as unknown as Request;

    const res = mockResponse();

    await createComplaint(req as any, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should fetch citizen complaints", async () => {
    vi.mocked(complaintService.getMyComplaints)
      .mockResolvedValue([mockComplaint] as any);

    const req = {
      user: { userId: "user123", role: "citizen" },
    } as unknown as Request;

    const res = mockResponse();

    await getMyComplaints(req as any, res);

    expect(complaintService.getMyComplaints)
      .toHaveBeenCalledWith("user123");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should fetch all complaints", async () => {
    vi.mocked(complaintService.getAllComplaints)
      .mockResolvedValue([mockComplaint] as any);

    const req = {} as Request;
    const res = mockResponse();

    await getAllComplaints(req as any, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(complaintService.getAllComplaints).toHaveBeenCalled();
  });

  it("should fetch a complaint by ID", async () => {
    vi.mocked(complaintService.getComplaintById)
      .mockResolvedValue(mockComplaint as any);

    const req = {
      params: { id: "507f1f77bcf86cd799439011" },
      user: { userId: "user123", role: "citizen" },
    } as unknown as Request;

    const res = mockResponse();

    await getComplaintById(req as any, res);

    expect(complaintService.getComplaintById).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
      "user123",
      "citizen"
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should return 404 when complaint is not found", async () => {
    vi.mocked(complaintService.getComplaintById)
      .mockRejectedValue(new Error("Complaint not found"));

    const req = {
      params: { id: "507f1f77bcf86cd799439011" },
      user: { userId: "user123", role: "citizen" },
    } as unknown as Request;

    const res = mockResponse();

    await getComplaintById(req as any, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should update complaint successfully", async () => {
    vi.mocked(complaintService.updateComplaint)
      .mockResolvedValue({
        ...mockComplaint,
        status: "in_progress",
      } as any);

    const req = {
      params: { id: "507f1f77bcf86cd799439011" },
      body: { status: "in_progress" },
    } as unknown as Request;

    const res = mockResponse();

    await updateComplaint(req as any, res);

    expect(complaintService.updateComplaint).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
      { status: "in_progress" }
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should reject invalid status transition", async () => {
    vi.mocked(complaintService.updateComplaint)
      .mockRejectedValue(new Error("Invalid complaint status transition"));

    const req = {
      params: { id: "507f1f77bcf86cd799439011" },
      body: { status: "resolved" },
    } as unknown as Request;

    const res = mockResponse();

    await updateComplaint(req as any, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should require resolution remarks", async () => {
    vi.mocked(complaintService.updateComplaint)
      .mockRejectedValue(
        new Error("Resolution remarks are required to close a complaint")
      );

    const req = {
      params: { id: "507f1f77bcf86cd799439011" },
      body: { status: "resolved" },
    } as unknown as Request;

    const res = mockResponse();

    await updateComplaint(req as any, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should prevent updating a closed complaint", async () => {
    vi.mocked(complaintService.updateComplaint)
      .mockRejectedValue(new Error("Closed complaint cannot be updated"));

    const req = {
      params: { id: "507f1f77bcf86cd799439011" },
      body: { status: "in_progress" },
    } as unknown as Request;

    const res = mockResponse();

    await updateComplaint(req as any, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
