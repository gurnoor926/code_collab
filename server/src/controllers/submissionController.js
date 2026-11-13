const mongoose  = require("mongoose");

const {
    runExamples,
    submitSolution,
} = require("../services/submissionService");

const Submission = require("../models/Submission");
const InterviewSession = require("../models/InterviewSession");

const validateIds = ({ problemId, interviewId }) => {
    if (!mongoose.isValidObjectId(problemId)) {
        return "Invalid problem ID";
    }

    if (
        interviewId &&
        !mongoose.isValidObjectId(interviewId)
    ) {
        return "Invalid interview ID";
    }

    return null;
};

const runCodeAgainstExamples = async (req, res) => {
    try {
        const {
            problemId,
            language,
            code,
        } = req.body;

        const idError = validateIds({ problemId });

        if (idError) {
            return res.status(400).json({
                success: false,
                message: idError,
            });
        }

        const result = await runExamples({
            userId: req.user.userId,
            problemId,
            language,
            code,
        });

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error(
            "Run examples error:",
            error.message
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.statusCode
                    ? error.message
                    : "Failed to run example test cases",
        });
    }
};

const submitCode = async (req, res) => {
    try {
        const {
            problemId,
            language,
            code,
            interviewId = null,
        } = req.body;

        const idError = validateIds({
            problemId,
            interviewId,
        });

        if (idError) {
            return res.status(400).json({
                success: false,
                message: idError,
            });
        }

        const result = await submitSolution({
            userId: req.user.userId,
            problemId,
            language,
            code,
            interviewId,
        });

        return res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error(
            "Submit solution error:",
            error.message
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.statusCode
                    ? error.message
                    : "Failed to evaluate submission",
        });
    }
};

const getMySubmissions = async (req, res) => {
    try {
        const {
            problemId,
            page = "1",
            limit = "10",
        } = req.query;

        const pageNumber = Number(page);
        const pageSize = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            pageNumber < 1 ||
            !Number.isInteger(pageSize) ||
            pageSize < 1 ||
            pageSize > 50
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid pagination parameters",
            });
        }

        const filter = {
            user: req.user.userId,
        };

        if (problemId) {
            if (!mongoose.isValidObjectId(problemId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid problem ID",
                });
            }

            filter.problem = problemId;
        }

        const [submissions, total] = await Promise.all([
            Submission.find(filter)
                .select(
                    "-sourceCode -errorMessage"
                )
                .populate("problem", "title slug difficulty")
                .sort({ submittedAt: -1 })
                .skip((pageNumber - 1) * pageSize)
                .limit(pageSize)
                .lean(),

            Submission.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                submissions,
                pagination: {
                    page: pageNumber,
                    limit: pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize),
                },
            },
        });
    } catch (error) {
        console.error(
            "Get submissions error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve submissions",
        });
    }
};

const getSubmissionById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid submission ID",
            });
        }

        const query = { _id: id };
        if (req.user.role !== "admin") {
            query.user = req.user.userId;
        }

        const submission = await Submission.findOne(query)
            .select("-__v")
            .populate("problem", "title slug difficulty")
            .populate("user", "name email")
            .lean();

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: submission,
        });
    } catch (error) {
        console.error(
            "Get submission error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve submission",
        });
    }
};

const getInterviewSubmissions = async (req, res) => {
    try {
        const { interviewId } = req.params;

        if (!mongoose.isValidObjectId(interviewId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid interview ID",
            });
        }

        const interview = await InterviewSession.findById(interviewId)
            .select("interviewer candidate")
            .lean();

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found",
            });
        }

        const userId = req.user.userId.toString();
        const isParticipant =
            interview.interviewer?.toString() === userId ||
            interview.candidate?.toString() === userId ||
            req.user.role === "admin";

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this interview's submissions",
            });
        }

        const submissions = await Submission.find({ interview: interviewId })
            .populate("problem", "title difficulty")
            .populate("user", "name email")
            .sort({ submittedAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            data: submissions,
        });
    } catch (error) {
        console.error("Get interview submissions error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve interview submissions",
        });
    }
};

module.exports = {
    runCodeAgainstExamples,
    submitCode,
    getMySubmissions,
    getSubmissionById,
    getInterviewSubmissions,
};