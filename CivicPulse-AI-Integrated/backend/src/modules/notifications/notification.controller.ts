
import { Request, Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware";

import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from "./notification.service";

// Get all notifications
export const getNotificationsController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first"
      });
    }

    const notifications = await getUserNotifications(userId);
    const unreadCount = await getUnreadCount(userId);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications
    });

  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
};

export const markNotificationReadController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    const notificationId = req.params.id as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first"
      });
    }

    const notification = await markNotificationAsRead(
      notificationId,
      userId
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification
    });

  } catch (error) {
    console.error("Mark notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
};

export const markAllNotificationsReadController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as AuthRequest).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first"
      });
    }

    await markAllNotificationsAsRead(userId);

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });

  } catch (error) {
    console.error("Mark all notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
};
