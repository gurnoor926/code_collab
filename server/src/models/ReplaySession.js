const mongoose = require("mongoose");

const replaySessionSchema = new mongoose.Schema(
    {
        interview: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "InterviewSession",
            required: true,
            unique: true,
        },

        startedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },

        endedAt: {
            type: Date,
            default: null,
        },

        lastSequence: {
            type: Number,
            default: 0,
            min: 0,
        },

        initialCode: {
            type: String,
            default: "",
            maxlength: 50000,
        },

        initialLanguage: {
            type: String,
            enum: ["javascript", "python", "java", "cpp"],
            default: "javascript",
        },

        status: {
            type: String,
            enum: ["recording", "completed"],
            default: "recording",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "ReplaySession",
    replaySessionSchema
);