const InterviewSession = require("../models/InterviewSession");
const Problem = require("../models/Problem");
const {
  notifyUser,
  notifyInterviewParticipants,
} = require("../utils/interviewNotifications");

const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

//create interview
const createInterview = async (req, res) => {
  try {
    const {
      title,
      description = "",
      problemIds = [],
      scheduledAt = null,
      durationMinutes = 60,
    } = req.body;

    // Validate problemIds
    if (!Array.isArray(problemIds)) {
      return res.status(400).json({
        success: false,
        message: "problemIds must be an array",
      });
    }

    // Validate selected problems only when IDs are provided
    if (problemIds.length > 0) {
      const uniqueProblemIds = [...new Set(problemIds)];

      if (uniqueProblemIds.length !== problemIds.length) {
        return res.status(400).json({
          success: false,
          message: "Duplicate problem IDs are not allowed",
        });
      }

      const publishedProblems = await Problem.countDocuments({
        _id: { $in: problemIds },
        isPublished: true,
      });

      if (publishedProblems !== problemIds.length) {
        return res.status(400).json({
          success: false,
          message:
            "One or more selected problems do not exist or are unpublished",
        });
      }
    }

    // Validate scheduled time
    if (scheduledAt !== null) {
      const scheduledDate = new Date(scheduledAt);

      if (Number.isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid future scheduled time",
        });
      }
    }

    // Create interview regardless of whether problems were selected
    const interview = await InterviewSession.create({
      title,
      description,
      interviewer: req.user.userId,
      problems: problemIds,
      scheduledAt,
      durationMinutes,
      status: "scheduled",
    });

    return res.status(201).json({
      success: true,
      message: "Interview created successfully",
      data: interview,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Room code collision. Please retry",
      });
    }

    console.error("Create interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create interview",
    });
  }
};

// get interviews

const getMyInterviews = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 10);

    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
    );

    const filter = {
      $or: [{ interviewer: req.user.userId }, { candidate: req.user.userId }],
    };

    const [interviews, total] = await Promise.all([
      InterviewSession.find(filter)
        .populate("interview", "name email avatar")
        .populate("candidate", "name email avatar")
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      InterviewSession.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: interviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get interviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve interviews",
    });
  }
};

//get interview by id

const getInterviewById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview ID",
      });
    }

    const interview = await InterviewSession.findById(id)
      .populate("interviewer", "name email avatar role")
      .populate("candidate", "name email avatar role")
      .populate("problems", "title slug difficulty category")
      .select("-__v")
      .lean();

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    const userId = req.user.userId;

    const isParticipant =
      interview.interviewer?._id.toString() === userId ||
      interview.candidate?._id.toString() === userId;

    const isAdmin = req.user.role === "admin";

    if (!isParticipant && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this interview",
      });
    }

    return res.status(200).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    console.error("Get interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve interview",
    });
  }
};

//join interview

const joinInterview = async (req, res) => {
  try {
    const { roomCode } = req.body;

    const interview = await InterviewSession.findOne({
      roomCode: roomCode.toUpperCase(),
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Invalid room code or Interview not found",
      });
    }

    if (req.user.role !== "candidate") {
      return res.status(403).json({
        success: false,
        message: "only candidaes can join using an invitation code",
      });
    }

    if (interview.status === "cancelled" || interview.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "This interview is no longer available",
      });
    }

    if (
      interview.candidate &&
      interview.candidate.toString() !== req.user.userId
    ) {
      return res.status(409).json({
        success: false,
        message: "This interview already has a candidate",
      });
    }

    if (interview.interviewer.toString() === req.user.userId) {
      return res.status(409).json({
        success: false,
        message: "Ypu cannot join your own interview as candidate",
      });
    }

    if (!interview.candidate) {
      interview.candidate = req.user.userId;
      interview.status = "waiting";

      await interview.save();

      await notifyUser({
        recipient: interview.interviewer,
        sender: req.user.userId,
        type: "interview_scheduled",
        title: "Candidate joined your interview",
        message: `${req.user.name || "A candidate"} has joined "${interview.title}".`,
        interviewId: interview._id,
      }).catch((error) => {
        console.error("Failed to notify interviewer:", error.message);
      });
    }

    return res.status(200).json({
      success: true,
      message: "You have joined the interview successfully",
      data: {
        interviewId: interview._id,
        roomCode: interview.roomCode,
        title: interview.title,
        status: interview.status,
      },
    });
  } catch (error) {
    console.error("Join interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to join interview",
    });
  }
};

// update interview status

const updateInterviewStatus = async (req, res, action) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Inavlid interview id",
      });
    }

    const interview = await InterviewSession.findById(id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    const isInterviewer = interview.interviewer.toString() === req.user.userId;

    const isAdmin = req.user.role === "admin";

    if (!isInterviewer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only interviewer or an admin can change interview status",
      });
    }

    if (action === "start") {
      if (interview.status !== "waiting") {
        return res.status(400).json({
          success: false,
          message: "Only waiting interviews can be started",
        });
      }

      interview.status = "active";
      interview.startedAt = new Date();
    } else if (action === "complete") {
      if (interview.status !== "active") {
        return res.status(400).json({
          success: false,
          message: "Only active interviews can be completed",
        });
      }
      interview.status = "completed";
      interview.endedAt = new Date();
    } else if (action === "cancel") {
      if (!["scheduled", "waiting"].includes(interview.status)) {
        return res.status(400).json({
          success: false,
          message: "Only scheduled or witing interviews can be cancelled",
        });
      }

      interview.status = "cancelled";
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid interview action",
      });
    }

    await interview.save();

    if (action === "start") {
      await notifyInterviewParticipants({
        interview,
        sender: req.user.userId,
        type: "interview_started",
        title: "Interview started",
        message: `"${interview.title}" has started.`,
      });
    }

    if (action === "complete") {
      await notifyInterviewParticipants({
        interview,
        sender: req.user.userId,
        type: "interview_completed",
        title: "Interview completed",
        message: `"${interview.title}" has been completed.`,
        includeInterviewer: false,
        includeCandidate: true,
      });
    }

    if (action === "cancel") {
      await notifyInterviewParticipants({
        interview,
        sender: req.user.userId,
        type: "interview_cancelled",
        title: "Interview cancelled",
        message: `"${interview.title}" has been cancelled.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Interview ${action} successful`,
      data: {
        id: interview._id,
        status: interview.status,
        startedAt: interview.startedAt,
        endedAt: interview.endedAt,
      },
    });
  } catch (error) {
    console.error("Update interview status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update interview status",
    });
  }
};

module.exports = {
  createInterview,
  getMyInterviews,
  getInterviewById,
  joinInterview,
  updateInterviewStatus,
};
