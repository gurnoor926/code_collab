const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: [
        "interview_scheduled",
        "interview_updated",
        "interview_cancelled",
        "interview_started",
        "interview_completed",
        "evaluation_published",
        "system",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    relatedInterview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewSession",
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Efficiently retrieve a user's notifications, newest first.
notificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

// Efficiently retrieve unread notifications.
notificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Notification", notificationSchema);