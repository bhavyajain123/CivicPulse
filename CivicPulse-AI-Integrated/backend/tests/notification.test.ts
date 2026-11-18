
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/modules/notifications/notification.model", () => ({
  default: {
    create: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateMany: vi.fn(),
  },
}));

import Notification from "../src/modules/notifications/notification.model";
import {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../src/modules/notifications/notification.service";

const validUserId = "507f1f77bcf86cd799439011";
const validNotificationId = "507f1f77bcf86cd799439012";
const validIncidentId = "507f1f77bcf86cd799439013";

describe("Notification Service Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a notification successfully", async () => {
    vi.mocked(Notification.create).mockResolvedValue({
      _id: validNotificationId,
      title: "New Incident",
    } as any);

    await createNotification({
      userId: validUserId,
      title: "New Incident",
      message: "A new incident has been reported.",
      type: "new_incident",
    });

    expect(Notification.create).toHaveBeenCalled();
  });

  it("should reject an invalid user ID during creation", async () => {
    await expect(
      createNotification({
        userId: "invalid-id",
        title: "Test",
        message: "Test notification",
        type: "new_incident",
      })
    ).rejects.toThrow("Invalid user ID");

    expect(Notification.create).not.toHaveBeenCalled();
  });

  it("should reject an invalid incident ID", async () => {
    await expect(
      createNotification({
        userId: validUserId,
        title: "Test",
        message: "Test notification",
        type: "new_incident",
        incidentId: "invalid-id",
      })
    ).rejects.toThrow("Invalid incident ID");

    expect(Notification.create).not.toHaveBeenCalled();
  });

  it("should fetch user notifications", async () => {
    const mockSort = vi.fn().mockResolvedValue([]);

    vi.mocked(Notification.find).mockReturnValue({
      sort: mockSort,
    } as any);

    await getUserNotifications(validUserId);

    expect(Notification.find).toHaveBeenCalledWith({
      userId: expect.any(Object),
    });
    expect(mockSort).toHaveBeenCalledWith({
      createdAt: -1,
    });
  });

  it("should reject an invalid user ID when fetching notifications", async () => {
    await expect(
      getUserNotifications("invalid-id")
    ).rejects.toThrow("Invalid user ID");

    expect(Notification.find).not.toHaveBeenCalled();
  });

  it("should fetch unread notification count", async () => {
    vi.mocked(Notification.countDocuments).mockResolvedValue(3);

    const count = await getUnreadCount(validUserId);

    expect(count).toBe(3);
    expect(Notification.countDocuments).toHaveBeenCalled();
  });

  it("should mark a notification as read", async () => {
    vi.mocked(Notification.findOneAndUpdate).mockResolvedValue({
      _id: validNotificationId,
      isRead: true,
    } as any);

    const result = await markNotificationAsRead(
      validNotificationId,
      validUserId
    );

    expect(result).toBeTruthy();
    expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: validNotificationId,
        userId: expect.any(Object),
      },
      { isRead: true },
      { new: true }
    );
  });

  it("should reject invalid notification ID", async () => {
    await expect(
      markNotificationAsRead("invalid-id", validUserId)
    ).rejects.toThrow("Invalid notification ID");

    expect(Notification.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("should mark all unread notifications as read", async () => {
    vi.mocked(Notification.updateMany).mockResolvedValue({
      modifiedCount: 2,
    } as any);

    const result = await markAllNotificationsAsRead(validUserId);

    expect(result.modifiedCount).toBe(2);
    expect(Notification.updateMany).toHaveBeenCalledWith(
      {
        userId: expect.any(Object),
        isRead: false,
      },
      { isRead: true }
    );
  });

  it("should reject invalid user ID when marking all notifications as read", async () => {
    await expect(
      markAllNotificationsAsRead("invalid-id")
    ).rejects.toThrow("Invalid user ID");

    expect(Notification.updateMany).not.toHaveBeenCalled();
  });
});
