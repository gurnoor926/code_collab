const mongoose = require("mongoose");

const InterviewSession = require("../models/InterviewSession");

const {
  startReplay,
  recordCodeChange,
  recordLanguageChange,
  createSnapshot,
  completeReplay,
  getReplayEvents,
} = require("../services/replayService");

// Check that the authenticated user can access this interview.
const getAuthorizedInterview = async (interviewId, user) => {
  if (!mongoose.isValidObjectId(interviewId)) {
    const error = new Error("Invalid interview ID");
    error.statusCode = 400;
    throw error;
  }

  const interview = await InterviewSession.findById(interviewId)
    .select("_id interviewer candidate status")
    .lean();

  if (!interview) {
    const error = new Error("Interview not found");
    error.statusCode = 404;
    throw error;
  }

  const userId = user.userId.toString();

  const isInterviewer =
    interview.interviewer?.toString() === userId;

  const isCandidate =
    interview.candidate?.toString() === userId;

  const isAdmin = user.role === "admin";

  if (!isInterviewer && !isCandidate && !isAdmin) {
    const error = new Error(
      "You do not have access to this interview",
    );
    error.statusCode = 403;
    throw error;
  }

  return interview;
};

// Start replay recording.
const startReplayController = async (req, res) => {
  try {
    const interview = await getAuthorizedInterview(
      req.params.interviewId,
      req.user,
    );

    if (req.user.role !== "admin" &&
        interview.interviewer.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Only the interviewer or an admin can start replay recording",
      });
    }

    const replay = await startReplay({
      interviewId: interview._id,
      initialCode: req.body.initialCode ?? "",
      initialLanguage: req.body.initialLanguage ?? "javascript",
    });

    return res.status(201).json({
      success: true,
      message: "Replay recording started",
      data: replay,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to start replay recording",
    });
  }
};

// Record a code change.
const recordCodeChangeController = async (req, res) => {
  try {
    const interview = await getAuthorizedInterview(
      req.params.interviewId,
      req.user,
    );

    const event = await recordCodeChange({
      interviewId: interview._id,
      userId: req.user.userId,
      code: req.body.code,
      language: req.body.language,
    });

    return res.status(201).json({
      success: true,
      message: "Code change recorded",
      data: event,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to record code change",
    });
  }
};

// Record a language change.
const recordLanguageChangeController = async (req, res) => {
  try {
    const interview = await getAuthorizedInterview(
      req.params.interviewId,
      req.user,
    );

    const event = await recordLanguageChange({
      interviewId: interview._id,
      userId: req.user.userId,
      language: req.body.language,
    });

    return res.status(201).json({
      success: true,
      message: "Language change recorded",
      data: event,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to record language change",
    });
  }
};

// Record a complete editor snapshot.
const createSnapshotController = async (req, res) => {
  try {
    const interview = await getAuthorizedInterview(
      req.params.interviewId,
      req.user,
    );

    const event = await createSnapshot({
      interviewId: interview._id,
      userId: req.user.userId,
      code: req.body.code,
      language: req.body.language,
    });

    return res.status(201).json({
      success: true,
      message: "Snapshot recorded",
      data: event,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to create snapshot",
    });
  }
};

// Retrieve replay events.
const getReplayEventsController = async (req, res) => {
  try {
    await getAuthorizedInterview(req.params.interviewId, req.user);

    const afterSequence =
      req.query.afterSequence === undefined
        ? 0
        : Number(req.query.afterSequence);

    const limit =
      req.query.limit === undefined
        ? 100
        : Number(req.query.limit);

    const replay = await getReplayEvents({
      interviewId: req.params.interviewId,
      afterSequence,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: replay,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to retrieve replay",
    });
  }
};

// Complete replay recording.
const completeReplayController = async (req, res) => {
  try {
    const interview = await getAuthorizedInterview(
      req.params.interviewId,
      req.user,
    );

    if (req.user.role !== "admin" &&
        interview.interviewer.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Only the interviewer or an admin can complete replay recording",
      });
    }

    const replay = await completeReplay(interview._id);

    return res.status(200).json({
      success: true,
      message: "Replay recording completed",
      data: replay,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to complete replay",
    });
  }
};

module.exports = {
  startReplayController,
  recordCodeChangeController,
  recordLanguageChangeController,
  createSnapshotController,
  getReplayEventsController,
  completeReplayController,
};
