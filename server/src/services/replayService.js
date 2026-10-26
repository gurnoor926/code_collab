const mongoose = require("mongoose");

const InterviewSession = require("../models/InterviewSession");
const ReplayEvent = require("../models/ReplayEvent");
const ReplaySession = require("../models/ReplaySession");

const LANGUAGE_ALLOWLIST = new Set(["javascript", "python", "cpp", "java"]);

const MAX_CODE_SIZE = 50_000;

const ensureValidId = (id, label = "ID") => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error(`Inavlid ${label}`);
    error.statusCode = 404;
    throw error;
  }
};

const ensureInterviewExists = async (interviewId) => {
  const interview = await InterviewSession.findById(interviewId)
    .select("_id status startedAt endedAt interviewer candidate")
    .lean();

  if (!interview) {
    const error = new Error("Interview not found");
    error.statusCode = 404;
    throw error;
  }

  return interview;
};

// start repaly recording, call this when interview actually starts
const startReplay = async ({
  interviewId,
  initialCode = "",
  initialLanguage = "javascript",
}) => {
  ensureValidId(interviewId, "Interview Id");

  if (typeof initialCode !== "string") {
    throw new Error("Initial code must be a string");
  }

  const initialCodeSize = Buffer.byteLength(initialCode, "utf8");

  if (initialCodeSize > MAX_CODE_SIZE) {
    throw new Error(
      `Initial code exceeds the maximum size of ${MAX_CODE_SIZE} bytes`,
    );
  }

  if (!LANGUAGE_ALLOWLIST.has(initialLanguage)) {
    const error = new Error("Unsupported language");
    error.statusCode = 409;
    throw error;
  }

  const interview = await ensureInterviewExists(interviewId);

if (interview.status !== "active") {
  const error = new Error("Interview must be active to start replay");
  error.statusCode = 409;
  throw error;
}

  const existing = await ReplaySession.findOne({
    interview: interviewId,
  });

  if (existing) {
    if (existing.status === "completed") {
      const error = new Error("Replay recording has already been completed");
      error.statusCode = 409;
      throw error;
    }

    return existing;
  }

  try {
    const session = await ReplaySession.create({
      interview: interviewId,
      startedAt: new Date(),
      initialCode,
      initialLanguage,
      status: "recording",
    });

    await recordReplayEvent({
      interviewId,
      userId: null,
      eventType: "interview_started",
      payload: {
        status: "active",
      },
    });

    await recordReplayEvent({
      interviewId,
      userId: null,
      eventType: "snapshot",
      payload: {
        code: initialCode,
        language: initialLanguage,
      },
    });

    return session;
  } catch (error) {
    // If another request created the replay session concurrently,
    // return the existing recording instead of creating a duplicate.
    if (error.code === 11000) {
      const existingSession = await ReplaySession.findOne({
        interview: interviewId,
      });

      if (existingSession) {
        return existingSession;
      }
    }

    throw error;
  }
};
/**
 * Record an event with an atomically allocated sequence number.
 */
const recordReplayEvent = async ({
  interviewId,
  userId = null,
  eventType,
  payload = {},
}) => {
  ensureValidId(interviewId, "interview ID");

  const replaySession = await ReplaySession.findOneAndUpdate(
    {
      interview: interviewId,
      status: "recording",
    },
    {
      $inc: {
        lastSequence: 1,
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (!replaySession) {
    const error = new Error(
      "Replay recording has not started or is already completed",
    );
    error.statusCode = 409;
    throw error;
  }

  const occuredAt = new Date();
  const elapsedMs = Math.max(
    0,
    occuredAt.getTime() - replaySession.startedAt.getTime(),
  );

  try {
    return await ReplayEvent.create({
      interview: interviewId,
      user: userId,
      eventType,
      sequence: replaySession.lastSequence,
      elapsedMs,
      occuredAt,
      payload,
    });
  } catch (error) {
    console.error("Failed to persist repaly event:", error.message);

    throw error;
  }
};
/**
 * Record a complete editor state.
 */
const recordCodeChange = async ({ interviewId, userId, code, language }) => {
  if (typeof code !== "string") {
    const error = new Error("Code must be a string");
    error.statusCode = 400;
    throw error;
  }

  if (Buffer.byteLength(code, "utf8") > MAX_CODE_SIZE) {
    const error = new Error("Code exceeds the maximum allowed size");
    error.statusCode = 413;
    throw error;
  }

  if (!LANGUAGE_ALLOWLIST.has(language)) {
    const error = new Error("Unsupported language");
    error.statusCode = 400;
    throw error;
  }

  return recordReplayEvent({
    interviewId,
    userId,
    eventType: "code_change",
    payload: {
      code,
      language,
    },
  });
};

/**
 * Record a programming language change.
 */
const recordLanguageChange = async ({ interviewId, userId, language }) => {
  if (!LANGUAGE_ALLOWLIST.has(language)) {
    const error = new Error("unsupported language");
    error.statusCode = 400;
    throw error;
  }

  return recordReplayEvent({
    interviewId,
    userId,
    eventType: "language_change",
    payload: {
      language,
    },
  });
};

/**
 * Save a full editor snapshot.
 */
const createSnapshot = async ({
  interviewId,
  userId = null,
  code,
  language,
}) => {
  return recordReplayEvent({
    interviewId,
    userId,
    eventType: "snapshot",
    payload: {
      code,
      language,
    },
  });
};

/**
 * Mark a replay as completed.
 */
const completeReplay = async (interviewId) => {
  ensureValidId(interviewId, "interview ID");

  const session = await ReplaySession.findOneAndUpdate(
    {
      interview: interviewId,
      status: "recording",
    },
    {
      $set: {
        status: "completed",
        endedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (!session) {
    const error = new Error("recording not found or already completed");
    error.statusCode = 404;
    throw error;
  }

  return session;
};

/**
 * Retrieve ordered replay events.
 */
const getReplayEvents = async ({
  interviewId,
  afterSequence = 0,
  limit = 500,
}) => {
  ensureValidId(interviewId, "Interview ID");

  if (!Number.isInteger(afterSequence) || afterSequence < 0) {
    const error = new Error("Invalid sequence number");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
    const error = new Error("Limit must be between 1 and 1000");
    error.statusCode = 400;
    throw error;
  }

  const session = await ReplaySession.findOne({
    interview: interviewId,
  }).lean();

  if (!session) {
    const error = new Error("Replay not found");
    error.statusCode = 404;
    throw error;
  }

  const events = await ReplayEvent.find({
    interview: interviewId,
    sequence: {
      $gt: afterSequence,
    },
  })
    .sort({
      sequence: 1,
    })
    .limit(limit)
    .lean();

  return {
    session: {
      interviewId,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      status: session.status,
      initialCode: session.initialCode,
      initialLanguage: session.initialLanguage,
      lastSequence: session.lastSequence,
    },
    events,
    nextAfterSequence:
      events.length > 0 ? events[events.length - 1].sequence : afterSequence,
    hasMore:
      events.length > 0 &&
      events[events.length - 1].sequence < session.lastSequence,
  };
};

module.exports = {
  startReplay,
  recordReplayEvent,
  recordCodeChange,
  recordLanguageChange,
  createSnapshot,
  completeReplay,
  getReplayEvents,
};
