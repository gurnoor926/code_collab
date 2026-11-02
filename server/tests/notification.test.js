const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../src/app");

const User = require("../src/models/User");
const Notification = require("../src/models/Notification");

let mongoServer;

let user;
let anotherUser;

let token;
let anotherUserToken;

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "5d",
    }
  );
};

const createNotification = async (recipient, overrides = {}) => {
  return Notification.create({
    recipient,
    type: "system",
    title: "Test Notification",
    message: "This is a test notification.",
    ...overrides,
  });
};

describe("Notification API Tests", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());

    user = await User.create({
      name: "Test User",
      email: "test@example.com",
      passwordHash: "TestPassword@123",
      role: "candidate",
    });

    anotherUser = await User.create({
      name: "Another User",
      email: "another@example.com",
      passwordHash: "TestPassword@123",
      role: "candidate",
    });

    token = generateToken(user);
    anotherUserToken = generateToken(anotherUser);
  });

  afterEach(async () => {
    await Notification.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();

    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  // ==========================================
  // GET ALL NOTIFICATIONS
  // ==========================================

  describe("GET /api/notifications", () => {
    test("should return all notifications for authenticated user", async () => {
      await createNotification(user._id);
      await createNotification(user._id);

      await createNotification(anotherUser._id);

      const response = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.notifications).toHaveLength(2);

      expect(response.body.data.pagination.total).toBe(2);
    });

    test("should return empty list when user has no notifications", async () => {
      const response = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.notifications).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });

    test("should return unread notifications only", async () => {
      await createNotification(user._id, {
        title: "Unread Notification",
        isRead: false,
      });

      await createNotification(user._id, {
        title: "Read Notification",
        isRead: true,
        readAt: new Date(),
      });

      const response = await request(app)
        .get("/api/notifications?unreadOnly=true")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.notifications).toHaveLength(1);

      expect(
        response.body.data.notifications[0].title
      ).toBe("Unread Notification");
    });

    test("should support pagination", async () => {
      await Promise.all(
        Array.from({ length: 5 }, (_, index) =>
          createNotification(user._id, {
            title: `Notification ${index + 1}`,
          })
        )
      );

      const response = await request(app)
        .get("/api/notifications?page=1&limit=2")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);

      expect(response.body.data.notifications).toHaveLength(2);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.pagination.total).toBe(5);
      expect(response.body.data.pagination.totalPages).toBe(3);
      expect(response.body.data.pagination.hasNextPage).toBe(true);
    });

    test("should limit maximum page size to 50", async () => {
      const response = await request(app)
        .get("/api/notifications?limit=100")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);

      expect(response.body.data.pagination.limit).toBe(50);
    });

    test("should reject unauthenticated requests", async () => {
      const response = await request(app)
        .get("/api/notifications");

      expect(response.status).toBe(401);
    });
  });

  // ==========================================
  // GET UNREAD COUNT
  // ==========================================

  describe("GET /api/notifications/unread-count", () => {
    test("should return unread notification count", async () => {
      await createNotification(user._id, {
        isRead: false,
      });

      await createNotification(user._id, {
        isRead: false,
      });

      await createNotification(user._id, {
        isRead: true,
        readAt: new Date(),
      });

      const response = await request(app)
        .get("/api/notifications/unread-count")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.unreadcount).toBe(2);
    });

    test("should return zero when there are no unread notifications", async () => {
      const response = await request(app)
        .get("/api/notifications/unread-count")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);

      expect(response.body.data.unreadcount).toBe(0);
    });

    test("should reject unauthenticated requests", async () => {
      const response = await request(app)
        .get("/api/notifications/unread-count");

      expect(response.status).toBe(401);
    });
  });

  // ==========================================
  // MARK SINGLE NOTIFICATION AS READ
  // ==========================================

  describe("PATCH /api/notifications/:id/read", () => {
    test("should mark notification as read", async () => {
      const notification = await createNotification(user._id);

      const response = await request(app)
        .patch(`/api/notifications/${notification._id}/read`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updatedNotification = await Notification.findById(
        notification._id
      );

      expect(updatedNotification.isRead).toBe(true);
      expect(updatedNotification.readAt).toBeTruthy();
    });

    test("should return 404 when notification is already read", async () => {
      const notification = await createNotification(user._id, {
        isRead: true,
        readAt: new Date(),
      });

      const response = await request(app)
        .patch(`/api/notifications/${notification._id}/read`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    test("should not allow user to mark another user's notification as read", async () => {
      const notification = await createNotification(anotherUser._id);

      const response = await request(app)
        .patch(`/api/notifications/${notification._id}/read`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);

      const unchangedNotification = await Notification.findById(
        notification._id
      );

      expect(unchangedNotification.isRead).toBe(false);
    });

    test("should return 404 for nonexistent notification", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/notifications/${fakeId}/read`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    test("should return 400 for invalid notification ID", async () => {
      const response = await request(app)
        .patch("/api/notifications/invalid-id/read")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    test("should reject unauthenticated requests", async () => {
      const notification = await createNotification(user._id);

      const response = await request(app)
        .patch(`/api/notifications/${notification._id}/read`);

      expect(response.status).toBe(401);
    });
  });

  // ==========================================
  // MARK ALL NOTIFICATIONS AS READ
  // ==========================================

  describe("PATCH /api/notifications/read-all", () => {
    test("should mark all user's unread notifications as read", async () => {
      await createNotification(user._id);
      await createNotification(user._id);

      await createNotification(anotherUser._id);

      const response = await request(app)
        .patch("/api/notifications/read-all")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.modifiedCount).toBe(2);

      const userNotifications = await Notification.find({
        recipient: user._id,
      });

      expect(userNotifications.every((item) => item.isRead)).toBe(true);

      const otherUserNotification = await Notification.findOne({
        recipient: anotherUser._id,
      });

      expect(otherUserNotification.isRead).toBe(false);
    });

    test("should return zero modified count when all notifications are already read", async () => {
      await createNotification(user._id, {
        isRead: true,
        readAt: new Date(),
      });

      const response = await request(app)
        .patch("/api/notifications/read-all")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.modifiedCount).toBe(0);
    });

    test("should reject unauthenticated requests", async () => {
      const response = await request(app)
        .patch("/api/notifications/read-all");

      expect(response.status).toBe(401);
    });
  });

  // ==========================================
  // DELETE NOTIFICATION
  // ==========================================

  describe("DELETE /api/notifications/:id", () => {
    test("should delete user's notification", async () => {
      const notification = await createNotification(user._id);

      const response = await request(app)
        .delete(`/api/notifications/${notification._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedNotification = await Notification.findById(
        notification._id
      );

      expect(deletedNotification).toBeNull();
    });

    test("should not allow deleting another user's notification", async () => {
      const notification = await createNotification(anotherUser._id);

      const response = await request(app)
        .delete(`/api/notifications/${notification._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);

      const existingNotification = await Notification.findById(
        notification._id
      );

      expect(existingNotification).not.toBeNull();
    });

    test("should return 404 for nonexistent notification", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/notifications/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    test("should return 400 for invalid notification ID", async () => {
      const response = await request(app)
        .delete("/api/notifications/invalid-id")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    test("should reject unauthenticated requests", async () => {
      const notification = await createNotification(user._id);

      const response = await request(app)
        .delete(`/api/notifications/${notification._id}`);

      expect(response.status).toBe(401);
    });
  });
});