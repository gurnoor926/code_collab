const mongoose = require("mongoose");

const interviewEvaluationSchema = new mongoose.Schema(
  {
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewSession",
      required: true,
      unique: true,
      index: true,
    },

    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    codingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    technicalSkills: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    problemSolving: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    communication: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    codeQuality: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    strengths: {
      type: [String],
      default: [],
    },

    areasForImprovement: {
      type: [String],
      default: [],
    },

    interviewerNotes: {
      type: String,
      maxlength: 5000,
      default: "",
    },

    recommendation: {
      type: String,
      enum: [
        "strong_hire",
        "hire",
        "hold",
        "no_hire",
      ],
      default: null,
    },

    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
      ],
      default: "draft",
    },

    submittedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model(
  "InterviewEvaluation",
  interviewEvaluationSchema,
);