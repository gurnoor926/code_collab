const mongoose = require("mongoose");
const crypto = require("crypto");

const interviewSessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    roomCode: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      uppercase: true,
      trim: true,
    },

    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    problems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
      },
    ],

    status: {
      type: String,
      enum: [
        "scheduled",
        "waiting",
        "active",
        "completed",
        "cancelled",
      ],
      default: "scheduled",
    },

    scheduledAt: {
      type: Date,
      default: null,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    endedAt: {
      type: Date,
      default: null,
    },

    durationMinutes: {
      type: Number,
      min: 1,
      max: 480,
      default: 60,
    },
  },
  {
    timestamps: true,
  }
);

interviewSessionSchema.index({
  interviewer: 1,
  status: 1,
});

interviewSessionSchema.index({
  candidate: 1,
  status: 1,
});

interviewSessionSchema.pre("validate", function () {
  if (!this.roomCode) {
    this.roomCode =
      "CC-" + crypto.randomBytes(4).toString("hex").toUpperCase();
  }
});

module.exports = mongoose.model(
  "InterviewSession",
  interviewSessionSchema
);