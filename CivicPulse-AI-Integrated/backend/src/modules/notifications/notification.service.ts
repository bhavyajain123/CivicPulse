
import mongoose from "mongoose";
import Notification from "./notification.model";

interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: string;
  incidentId?: string;
}

const validateObjectId = (id: string, field: string): void => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error(`Invalid ${field} ID`);
  }
};

export const createNotification = async (
  data: CreateNotificationData
) => {
  validateObjectId(data.userId, "user");

  if (data.incidentId) {
    validateObjectId(data.incidentId, "incident");
  }

  const notification = await Notification.create({
    userId: new mongoose.Types.ObjectId(data.userId),
    title: data.title,
    message: data.message,
    type: data.type,
    incidentId: data.incidentId
      ? new mongoose.Types.ObjectId(data.incidentId)
      : undefined
  });

  return notification;
};

export const getUserNotifications = async (
  userId: string
) => {
  validateObjectId(userId, "user");

  return Notification.find({
    userId: new mongoose.Types.ObjectId(userId)
  }).sort({ createdAt: -1 });
};

export const getUnreadCount = async (
  userId: string
) => {
  validateObjectId(userId, "user");

  return Notification.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    isRead: false
  });
};

export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
) => {
  validateObjectId(notificationId, "notification");
  validateObjectId(userId, "user");

  return Notification.findOneAndUpdate(
    {
      _id: notificationId,
      userId: new mongoose.Types.ObjectId(userId)
    },
    { isRead: true },
    { new: true }
  );
};

export const markAllNotificationsAsRead = async (
  userId: string
) => {
  validateObjectId(userId, "user");

  return Notification.updateMany(
    {
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false
    },
    { isRead: true }
  );
};
