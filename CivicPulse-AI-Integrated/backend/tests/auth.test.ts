
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";

vi.mock("../src/modules/auth/auth.service", () => ({
  registerUser: vi.fn(),
  loginUser: vi.fn(),
}));

import { register, login } from "../src/modules/auth/auth.controller";
import { registerUser, loginUser } from "../src/modules/auth/auth.service";

const mockResponse = () => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res as unknown as Response;
};

describe("Auth Controller Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Register", () => {
    it("should register a user successfully", async () => {
      const user = {
        id: "user123",
        name: "Test User",
        email: "test@example.com",
        phone: "9876543210",
        role: "citizen",
      };

      vi.mocked(registerUser).mockResolvedValue(user);

      const req = {
        body: {
          name: "Test User",
          email: "test@example.com",
          phone: "9876543210",
          password: "password123",
        },
      } as Request;

      const res = mockResponse();

      await register(req, res);

      expect(registerUser).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user,
        })
      );
    });

    it("should reject invalid registration data", async () => {
      const req = {
        body: {
          name: "AB",
          email: "invalid-email",
          phone: "9876543210",
          password: "123",
        },
      } as Request;

      const res = mockResponse();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(registerUser).not.toHaveBeenCalled();
    });

    it("should return 409 when email already exists", async () => {
      vi.mocked(registerUser).mockRejectedValue(
        new Error("Email is already registered")
      );

      const req = {
        body: {
          name: "Test User",
          email: "test@example.com",
          phone: "9876543210",
          password: "password123",
        },
      } as Request;

      const res = mockResponse();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe("Login", () => {
    it("should login successfully", async () => {
      const loginData = {
        user: {
          id: "user123",
          name: "Test User",
          email: "test@example.com",
          phone: "9876543210",
          role: "citizen",
        },
        token: "test-token",
      };

      vi.mocked(loginUser).mockResolvedValue(loginData);

      const req = {
        body: {
          email: "test@example.com",
          password: "password123",
        },
      } as Request;

      const res = mockResponse();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: "test-token",
        })
      );
    });

    it("should reject invalid login data", async () => {
      const req = {
        body: {
          email: "invalid-email",
          password: "",
        },
      } as Request;

      const res = mockResponse();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(loginUser).not.toHaveBeenCalled();
    });

    it("should return 401 for incorrect credentials", async () => {
      vi.mocked(loginUser).mockRejectedValue(
        new Error("Invalid email or password")
      );

      const req = {
        body: {
          email: "test@example.com",
          password: "wrongpassword",
        },
      } as Request;

      const res = mockResponse();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
