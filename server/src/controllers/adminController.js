const mongoose = require("mongoose");
const User = require("../models/User");
const Problem = require("../models/Problem");
const InterviewSession = require("../models/InterviewSession");
const Submission = require("../models/Submission");
const InterviewEvaluation = require("../models/InterviewEvaluation");

const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      candidates,
      interviewers,
      admins,
      totalProblems,
      publishedProblems,
      unpublishedProblems,
      easyProblems,
      mediumProblems,
      hardProblems,
      totalInterviews,
      scheduledInterviews,
      waitingInterviews,
      activeInterviews,
      completedInterviews,
      cancelledInterviews,
      totalSubmissions,
      acceptedSubmissions,
      evaluations,
      recentInterviews,
      recentSubmissions,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "candidate" }),
      User.countDocuments({ role: "interviewer" }),
      User.countDocuments({ role: "admin" }),

      Problem.countDocuments(),
      Problem.countDocuments({ isPublished: true }),
      Problem.countDocuments({ isPublished: false }),
      Problem.countDocuments({ difficulty: "Easy" }),
      Problem.countDocuments({ difficulty: "Medium" }),
      Problem.countDocuments({ difficulty: "Hard" }),

      InterviewSession.countDocuments(),
      InterviewSession.countDocuments({ status: "scheduled" }),
      InterviewSession.countDocuments({ status: "waiting" }),
      InterviewSession.countDocuments({ status: "active" }),
      InterviewSession.countDocuments({ status: "completed" }),
      InterviewSession.countDocuments({ status: "cancelled" }),

      Submission.countDocuments(),
      Submission.countDocuments({ status: "Accepted" }),

      InterviewEvaluation.find({ status: "submitted" })
        .select("overallScore codingScore recommendation")
        .lean(),

      InterviewSession.find()
        .populate("interviewer", "name email avatar")
        .populate("candidate", "name email avatar")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),

      Submission.find()
        .populate("user", "name email")
        .populate("problem", "title difficulty")
        .sort({ submittedAt: -1 })
        .limit(6)
        .lean(),

      User.find()
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    // Evaluation stats
    const totalEvaluations = evaluations.length;
    let totalScore = 0;
    let totalCodingScore = 0;
    const recommendations = {
      strong_hire: 0,
      hire: 0,
      hold: 0,
      no_hire: 0,
    };

    evaluations.forEach((ev) => {
      totalScore += Number(ev.overallScore) || 0;
      totalCodingScore += Number(ev.codingScore) || 0;
      if (recommendations[ev.recommendation] !== undefined) {
        recommendations[ev.recommendation]++;
      }
    });

    const averageOverallScore = totalEvaluations
      ? Math.round((totalScore / totalEvaluations) * 10) / 10
      : 0;
    const averageCodingScore = totalEvaluations
      ? Math.round((totalCodingScore / totalEvaluations) * 10) / 10
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          candidates,
          interviewers,
          admins,
        },
        problems: {
          total: totalProblems,
          published: publishedProblems,
          unpublished: unpublishedProblems,
          easy: easyProblems,
          medium: mediumProblems,
          hard: hardProblems,
        },
        interviews: {
          total: totalInterviews,
          scheduled: scheduledInterviews,
          waiting: waitingInterviews,
          active: activeInterviews,
          completed: completedInterviews,
          cancelled: cancelledInterviews,
        },
        submissions: {
          total: totalSubmissions,
          accepted: acceptedSubmissions,
          failed: totalSubmissions - acceptedSubmissions,
          passRate: totalSubmissions
            ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
            : 0,
        },
        evaluations: {
          total: totalEvaluations,
          averageOverallScore,
          averageCodingScore,
          recommendations,
        },
        recentActivity: {
          interviews: recentInterviews,
          submissions: recentSubmissions,
          users: recentUsers,
        },
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch admin stats",
    });
  }
};

const getAdminUsers = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 15)
    );
    const { role, search } = req.query;

    const filter = {};
    if (role && ["candidate", "interviewer", "admin"].includes(role)) {
      filter.role = role;
    }

    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get admin users error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

const getAdminInterviews = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 15)
    );
    const { status, search } = req.query;

    const filter = {};
    if (
      status &&
      ["scheduled", "waiting", "active", "completed", "cancelled"].includes(
        status
      )
    ) {
      filter.status = status;
    }

    if (search && search.trim()) {
      filter.title = { $regex: search.trim(), $options: "i" };
    }

    const skip = (page - 1) * limit;

    const [interviews, total] = await Promise.all([
      InterviewSession.find(filter)
        .populate("interviewer", "name email avatar")
        .populate("candidate", "name email avatar")
        .populate("problems", "title difficulty")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InterviewSession.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: interviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get admin interviews error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch interviews",
    });
  }
};

const getAdminSubmissions = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );
    const { interviewId, problemId, status, language } = req.query;

    const filter = {};
    if (interviewId && mongoose.isValidObjectId(interviewId)) {
      filter.interview = interviewId;
    }
    if (problemId && mongoose.isValidObjectId(problemId)) {
      filter.problem = problemId;
    }
    if (status) {
      filter.status = status;
    }
    if (language) {
      filter.language = language;
    }

    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .populate("user", "name email avatar")
        .populate("problem", "title difficulty")
        .populate("interview", "title status roomCode")
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Submission.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get admin submissions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch submissions",
    });
  }
};

module.exports = {
  getAdminStats,
  getAdminUsers,
  getAdminInterviews,
  getAdminSubmissions,
};

