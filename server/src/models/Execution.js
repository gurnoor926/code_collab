const mongoose = require("mongoose");

const executionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        token: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        language: {
            type: String,
            enum: ["javascript", "python", "cpp", "java"],
            required: true,
        },

        status: {
            type: String,
            enum: [
                "Queued",
                "Processing",
                "Accepted",
                "Wrong Answer",
                "Compilation Error",
                "Runtime Error",
                "Time Limit Exceeded",
                "Internal Error",
                "Unknown",
            ],
            default: "Queued",
        },
    },
    {
        timestamps: true,
    }
);

// Efficiently retrieve a user's executions.
executionSchema.index({ user: 1, createdAt: -1 });

const Execution = mongoose.model("Execution", executionSchema);

module.exports = Execution;