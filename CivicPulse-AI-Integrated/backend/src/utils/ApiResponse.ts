
import type { Response } from "express";

class ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;

  constructor(
    message: string,
    data: T | null = null,
    success: boolean = true
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
  }

  static send<T>(
    res: Response,
    statusCode: number,
    message: string,
    data: T | null = null
  ): Response {
    return res.status(statusCode).json(
      new ApiResponse<T>(message, data, statusCode < 400)
    );
  }

  static success<T>(
    res: Response,
    message: string,
    data: T | null = null,
    statusCode: number = 200
  ): Response {
    return ApiResponse.send(res, statusCode, message, data);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    data: null = null
  ): Response {
    return ApiResponse.send(res, statusCode, message, data);
  }
}

export default ApiResponse;
