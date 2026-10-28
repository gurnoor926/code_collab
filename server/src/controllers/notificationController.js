const {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} = require("../services/notificationService");

const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const result = await getUserNotifications(req.user.userId, {
      page,
      limit,
      unreadOnly,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve notifications",
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await getUnreadNotificationCount(req.user.userId);

    return res.status(200).json({
      success: true,
      data: { unreadcount: count },
    });
  } catch (error) {
    console.error("Get unread count error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve unread count",
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const result = await markAllNotificationsAsRead(req.user.userId);

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: result,
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to mark notifications as read",
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await markNotificationAsRead(
      req.params.id,
      req.user.userId
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found or already read",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to mark notification as read",
    });
  }
};

const removeNotification = async (req, res) => {
  try {
    const notification = await deleteNotification(
      req.params.id,
      req.user.userId
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to delete notification",
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  removeNotification,
};