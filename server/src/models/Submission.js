const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        problem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Problem",
            required: true,
            index: true,
        },

        interview: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "InterviewSession",
            default: null,
        },

        language: {
            type: String,
            enum: ["javascript", "python", "cpp", "java"],
            required: true,
        },

        sourceCode: {
            type: String,
            required: true,
            maxlength: 50000,
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Running",
                "Accepted",
                "Wrong Answer",
                "Compilation Error",
                "Runtime Error",
                "Time Limit Exceeded",
                "Memory Limit Exceeded",
                "Internal Error",
            ],
            default: "Pending",
        },

        totalTestCases: {
            type: Number,
            default: 0,
        },

        passedTestCases: {
            type: Number,
            default: 0,
        },

        executionTime: {
            type: Number,
            default: null,
        },

        memoryUsed: {
            type: Number,
            default: null,
        },

        errorMessage: {
            type: String,
            default: null,
        },

        submittedAt: {
            type: Date,
            default: Date.now,
        },
},
{
    timestamps: true,
}
);

submissionSchema.index({
    user:1,
    problem:1,
    submittedAt:-1,
})

module.exports = mongoose.model("Submission", submissionSchema);