const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  removeNotification,
} = require("../controllers/notificationController");

// All notification endpoints require authentication.
router.use(protect);

// GET /api/notifications
router.get("/", getNotifications);

// GET /api/notifications/unread-count
router.get("/unread-count", getUnreadCount);

// PATCH /api/notifications/read-all
router.patch("/read-all", markAllAsRead);

// PATCH /api/notifications/:id/read
router.patch("/:id/read", markAsRead);

// DELETE /api/notifications/:id
router.delete("/:id", removeNotification);

module.exports = router;