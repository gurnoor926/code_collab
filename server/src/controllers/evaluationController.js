const InterviewSession = require("../models/InterviewSession");
const { notifyUser } = require("../utils/interviewNotifications");

const {
  getOrCreateEvaluation,
  calculateOverallScore,
} = require("../services/evaluationService");

const isParticipantOrAdmin = (interview, user) => {
  const userId = user.userId.toString();

  return (
    interview.interviewer?.toString() === userId ||
    interview.candidate?.toString() === userId ||
    user.role === "admin"
  );
};

// Get the current evaluation.
const getEvaluation = async (req, res) => {
  try {
    const interview = await InterviewSession.findById(req.params.interviewId);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    // Verify that the user is an interview participant or admin.
    if (!isParticipantOrAdmin(interview, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this evaluation",
      });
    }

    const result = await getOrCreateEvaluation(req.params.interviewId);

    const { evaluation, coding } = result;

    const userId = req.user.userId.toString();

    const isInterviewer = interview.interviewer?.toString() === userId;

    const isCandidate = interview.candidate?.toString() === userId;

    const isAdmin = req.user.role === "admin";

    // Candidates cannot view draft evaluations.
    if (
      isCandidate &&
      !isInterviewer &&
      !isAdmin &&
      evaluation.status !== "submitted"
    ) {
      return res.status(403).json({
        success: false,
        message: "Evaluation is not yet available",
      });
    }

    // Return only approved report fields to candidates.
    if (isCandidate && !isInterviewer && !isAdmin) {
      return res.status(200).json({
        success: true,
        data: {
          evaluation: {
            codingScore: evaluation.codingScore,
            technicalSkills: evaluation.technicalSkills,
            problemSolving: evaluation.problemSolving,
            communication: evaluation.communication,
            codeQuality: evaluation.codeQuality,
            strengths: evaluation.strengths,
            areasForImprovement: evaluation.areasForImprovement,
            recommendation: evaluation.recommendation,
            overallScore: evaluation.overallScore,
            status: evaluation.status,
            submittedAt: evaluation.submittedAt,
          },
          coding,
        },
      });
    }

    // Interviewers and admins can access the complete evaluation.
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get evaluation error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve evaluation",
    });
  }
};
// Submit interviewer ratings and feedback.
const submitEvaluation = async (req, res) => {
  try {
    const interview = await InterviewSession.findById(req.params.interviewId);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    const isInterviewer = interview.interviewer?.toString() === req.user.userId;

    if (!isInterviewer && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only the interviewer or an admin can submit evaluation",
      });
    }

    if (interview.status !== "completed") {
      return res.status(409).json({
        success: false,
        message: "Only completed interviews can be evaluated",
      });
    }

    const {
      technicalSkills,
      problemSolving,
      communication,
      codeQuality,
      strengths = [],
      areasForImprovement = [],
      interviewerNotes = "",
      recommendation,
    } = req.body;

    const ratings = {
      technicalSkills,
      problemSolving,
      communication,
      codeQuality,
    };

    for (const [key, value] of Object.entries(ratings)) {
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        return res.status(400).json({
          success: false,
          message: `${key} must be an integer from 1 to 5`,
        });
      }
    }

    const validRecommendations = ["strong_hire", "hire", "hold", "no_hire"];

    if (!validRecommendations.includes(recommendation)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recommendation",
      });
    }

    if (
      !Array.isArray(strengths) ||
      !Array.isArray(areasForImprovement) ||
      typeof interviewerNotes !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback format",
      });
    }

    if (
      strengths.length > 20 ||
      areasForImprovement.length > 20 ||
      strengths.some((item) => typeof item !== "string" || item.length > 500) ||
      areasForImprovement.some(
        (item) => typeof item !== "string" || item.length > 500,
      ) ||
      interviewerNotes.length > 5000
    ) {
      return res.status(400).json({
        success: false,
        message: "Feedback exceeds the allowed limits",
      });
    }

    const { evaluation, coding } = await getOrCreateEvaluation(
      req.params.interviewId,
    );

    if (evaluation.status === "submitted") {
      return res.status(409).json({
        success: false,
        message: "Evaluation has already been submitted",
      });
    }

    const overallScore = calculateOverallScore({
      codingScore: coding.codingScore,
      ...ratings,
    });

    evaluation.candidate = interview.candidate;
    evaluation.interviewer = interview.interviewer;
    evaluation.codingScore = coding.codingScore;
    evaluation.technicalSkills = technicalSkills;
    evaluation.problemSolving = problemSolving;
    evaluation.communication = communication;
    evaluation.codeQuality = codeQuality;
    evaluation.strengths = strengths;
    evaluation.areasForImprovement = areasForImprovement;
    evaluation.interviewerNotes = interviewerNotes;
    evaluation.recommendation = recommendation;
    evaluation.overallScore = overallScore;
    evaluation.status = "submitted";
    evaluation.submittedAt = new Date();

    await evaluation.save();

    if (evaluation.candidate) {
      await notifyUser({
        recipient: evaluation.candidate,
        sender: req.user.userId,
        type: "evaluation_published",
        title: "Interview evaluation published",
        message: `Your evaluation for "${interview.title}" is now available.`,
        interviewId: interview._id,
      }).catch((error) => {
        console.error(
          "Failed to create evaluation notification:",
          error.message,
        );
      });
    }

    return res.status(200).json({
      success: true,
      message: "Evaluation submitted successfully",
      data: {
        evaluation,
        coding,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to submit evaluation",
    });
  }
};

module.exports = {
  getEvaluation,
  submitEvaluation,
};
