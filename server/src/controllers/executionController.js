const {
    submitCode,
    getSubmissionResult,
} = require("../services/judge0Service");

const Execution = require("../models/Execution");

const {
    validateExecutionRequest,
} = require("../utils/executionValidation");

const getExecutionStatus = (statusId) => {
    const statuses = {
        1: "Queued",
        2: "Processing",
        3: "Accepted",
        4: "Wrong Answer",
        5: "Time Limit Exceeded",
        6: "Compilation Error",
        7: "Runtime Error",
        8: "Runtime Error",
        9: "Runtime Error",
        10: "Runtime Error",
        11: "Runtime Error",
        12: "Runtime Error",
        13: "Internal Error",
        14: "Runtime Error",
    };

    return statuses[statusId] || "Unknown";
};

const runCode = async (req, res) => {
    try {
        const validation = validateExecutionRequest(req.body);

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message,
            });
        }

        const submission = await submitCode(validation.data);

        if (!submission?.token) {
            return res.status(502).json({
                success: false,
                message: "Judge0 did not return a submission token",
            });
        }

        // Save execution ownership in MongoDB.
        await Execution.create({
            user: req.user.userId,
            token: submission.token,
            language: validation.data.language,
            status: "Queued",
        });

        return res.status(202).json({
            success: true,
            message: "Code submitted successfully",
            data: {
                token: submission.token,
            },
        });

    } catch (error) {
        console.error(
            "Judge0 submission error:",
            error.response?.data || error.message
        );

        if (error.code === "ECONNABORTED") {
            return res.status(504).json({
                success: false,
                message: "Judge0 request timed out",
            });
        }

        return res.status(502).json({
            success: false,
            message: "Unable to submit code to Judge0",
        });
    }
};

const getCodeResult = async (req, res) => {
    try {
        const { token } = req.params;

        if (
            typeof token !== "string" ||
            !/^[a-f0-9-]{36}$/i.test(token)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid submission token",
            });
        }

        // Verify that this execution belongs to the logged-in user.
        const execution = await Execution.findOne({
            token,
            user: req.user.userId,
        });

        if (!execution) {
            return res.status(404).json({
                success: false,
                message: "Execution not found",
            });
        }

        const result = await getSubmissionResult(token);

        // Update execution status.
        const statusId = result?.status?.id;

        if (statusId !== undefined) {
            execution.status = getExecutionStatus(statusId);
            await execution.save();
        }

        return res.status(200).json({
            success: true,
            data: result,
        });

    } catch (error) {
        console.error(
            "Judge0 result error:",
            error.response?.data || error.message
        );

        if (error.code === "ECONNABORTED") {
            return res.status(504).json({
                success: false,
                message: "Judge0 request timed out",
            });
        }

        return res.status(502).json({
            success: false,
            message: "Unable to retrieve the execution result",
        });
    }
};

module.exports = {
    runCode,
    getCodeResult,
};