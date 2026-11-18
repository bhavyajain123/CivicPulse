
import { Request, Response } from "express";

import {
  getDashboardStatistics,
  getIncidentOverview,
  getPriorityStatistics,
  getCategoryStatistics,
  getMonthlyStatistics,
  getTeamStatistics,
  getDepartmentStatistics
} from "./analytics.service";

export const getDashboardStatisticsController = async (
  req: Request,
  res: Response
) => {
  try {
    const statistics = await getDashboardStatistics();

    return res.status(200).json({
      success: true,
      message: "Dashboard statistics fetched successfully",
      statistics
    });
  } catch (error) {
    console.error("Analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics"
    });
  }
};

export const getIncidentOverviewController = async (
  req: Request,
  res: Response
) => {
  try {
    const statistics = await getIncidentOverview();

    return res.status(200).json({
      success: true,
      message: "Incident overview fetched successfully",
      statistics
    });
  } catch (error) {
    console.error("Incident overview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch incident overview"
    });
  }
};

export const getPriorityStatisticsController = async (
  req: Request,
  res: Response
) => {
  try {
    const statistics = await getPriorityStatistics();

    return res.status(200).json({
      success: true,
      message: "Priority statistics fetched successfully",
      statistics
    });
  } catch (error) {
    console.error("Priority statistics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch priority statistics"
    });
  }
};

export const getCategoryStatisticsController = async (
  req: Request,
  res: Response
) => {
  try {
    const statistics = await getCategoryStatistics();

    return res.status(200).json({
      success: true,
      message: "Category statistics fetched successfully",
      statistics
    });
  } catch (error) {
    console.error("Category statistics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch category statistics"
    });
  }
};

export const getMonthlyStatisticsController = async (
  req: Request,
  res: Response
) => {
  try {
    const statistics = await getMonthlyStatistics();

    return res.status(200).json({
      success: true,
      message: "Monthly statistics fetched successfully",
      statistics
    });
  } catch (error) {
    console.error("Monthly statistics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly statistics"
    });
  }
};

export const getTeamStatisticsController = async (
  req: Request,
  res: Response
) => {
  try {
    const statistics = await getTeamStatistics();

    return res.status(200).json({
      success: true,
      message: "Team statistics fetched successfully",
      statistics
    });
  } catch (error) {
    console.error("Team statistics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch team statistics"
    });
  }
};

export const getDepartmentStatisticsController = async (
  req: Request,
  res: Response
) => {
  try {
    const statistics = await getDepartmentStatistics();

    return res.status(200).json({
      success: true,
      message: "Department statistics fetched successfully",
      statistics
    });
  } catch (error) {
    console.error("Department statistics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch department statistics"
    });
  }
};
