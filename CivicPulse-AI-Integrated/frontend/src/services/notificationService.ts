import { api } from "./api";

export type Notification = {
  _id: string;
  title: string;
  message: string;
  type: "new_incident" | "incident_assigned" | "incident_resolved";
  incidentId?: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

type NotificationListResponse = {
  success: boolean;
  count: number;
  unreadCount: number;
  notifications: Notification[];
};

type NotificationActionResponse = {
  success: boolean;
  message: string;
  notification?: Notification;
};

export const notificationService = {
  getAll: async () => {
    const response = await api<NotificationListResponse>("/notifications");

    return {
      notifications: response.notifications,
      unreadCount: response.unreadCount,
    };
  },

  markRead: async (id: string) =>
    api<NotificationActionResponse>(`/notifications/${id}/read`, {
      method: "PATCH",
    }),

  markAllRead: async () =>
    api<NotificationActionResponse>("/notifications/read-all", {
      method: "PATCH",
    }),
};