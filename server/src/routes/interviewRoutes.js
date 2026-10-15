const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const validate = require("../middleware/validateMiddleware");

const {
  createInterview,
  getMyInterviews,
  getInterviewById,
  joinInterview,
  updateInterviewStatus,
} = require("../controllers/interviewController");

const {
  createInterviewSchema,
  joinInterviewSchema,
} = require("../schemas/interviewSchema");

// All interview routes require authentication.
router.use(protect);

// Create an interview.
router.post(
  "/",
  authorizeRoles("admin", "interviewer"),
  validate(createInterviewSchema),
  createInterview
);

// List the logged-in user's interviews.
router.get("/my", getMyInterviews);

// Join using an invitation code.
router.post(
  "/join",
  authorizeRoles("candidate"),
  validate(joinInterviewSchema),
  joinInterview
);

// Start an interview
router.patch("/:id/start", protect, (req, res) =>
    updateInterviewStatus(req, res, "start")
);

router.patch("/:id/complete", protect, (req, res) =>
    updateInterviewStatus(req, res, "complete")
);

router.patch("/:id/cancel", protect, (req, res) =>
    updateInterviewStatus(req, res, "cancel")
);

// Retrieve one interview.
router.get("/:id", getInterviewById);

module.exports = router;