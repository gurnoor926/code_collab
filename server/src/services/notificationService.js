const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const { emitNotifications } = require("../socket/notificationSocket");

const createNotification = async ({
  recipient,
  sender = null,
  type,
  title,
  message,
  relatedInterview = null,
  metadata = {},
}) => {
  if (!mongoose.isValidObjectId(recipient)) {
    const error = new Error("A valid Recipient ID is required");
    error.statusCode = 400;
    throw error;
  }

  if (sender && !mongoose.isValidObjectId(sender)) {
    const error = new Error("A valid Sender ID is required");
    error.statusCode = 400;
    throw error;
  }

  if (relatedInterview && !mongoose.isValidObjectId(relatedInterview)) {
    const error = new Error("Invalid notification ID");
    error.statusCode = 400;
    throw error;
  }

  const notification = await Notification.create({
    recipient,
    sender,
    type,
    title,
    message,
    relatedInterview,
    metadata,
  });

  const populatedNotification = await Notification.findById(notification._id)
    .populate("sender", "name avatar")
    .populate("relatedInterview", "title status scheduledAt")
    .lean();

  emitNotifications(recipient, populatedNotification);

  return populatedNotification;
};

const getUserNotifications = async (
  userId,
  { page = 1, limit = 20, unreadOnly = false } = {},
) => {
  if (!mongoose.isValidObjectId(userId)) {
  const error = new Error("A valid user ID is required");
  error.statusCode = 400;
  throw error;
}

  page = Math.max(1, Number.parseInt(page, 10) || 1);
  limit = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 20));

  const filter = { recipient: userId };

  if (unreadOnly === true || unreadOnly === "true") {
    filter.isRead = false;
  }

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .populate("sender", "name avatar")
      .populate("relatedInterview", "title status scheduledAt")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
    },
  };
};

const getUnreadNotificationCount = async (userId) => {

  if (!mongoose.isValidObjectId(userId)) {
  const error = new Error("A valid user ID is required");
  error.statusCode = 400;
  throw error;
}

  return Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });
};

const markNotificationAsRead = async (notificationId, userId) => {
  if (!mongoose.isValidObjectId(notificationId)) {
    const error = new Error("Invalid notification ID");
    error.statusCode = 400;
    throw error;
  }
  if (!mongoose.isValidObjectId(userId)) {
    const error = new Error("A valid user ID is required");
    error.statusCode = 400;
    throw error;
  }

  return Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipient: userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );
};

const markAllNotificationsAsRead = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    const error = new Error("A valid user ID is required");
    error.statusCode = 400;
    throw error;
  }

  const result = await Notification.updateMany(
    {
      recipient: userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    },
  );

  return {
    modifiedCount: result.modifiedCount,
  };
};

const deleteNotification = async (notificationId, userId) => {
  if (!mongoose.isValidObjectId(notificationId)) {
    const error = new Error("Invalid notification ID");
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.isValidObjectId(userId)) {
    const error = new Error("A valid user ID is required");
    error.statusCode = 400;
    throw error;
  }

  return Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });
};

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
