const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  startReplayController,
  recordCodeChangeController,
  recordLanguageChangeController,
  createSnapshotController,
  getReplayEventsController,
  completeReplayController,
} = require("../controllers/replayController");

// Every replay route requires authentication.
router.use(protect);

// Start recording.
router.post("/:interviewId/start", startReplayController);

// Record editor changes.
router.post("/:interviewId/code-change", recordCodeChangeController);

router.post(
  "/:interviewId/language-change",
  recordLanguageChangeController,
);

// Record a full editor snapshot.
router.post("/:interviewId/snapshot", createSnapshotController);

// Retrieve replay events with pagination.
router.get("/:interviewId/events", getReplayEventsController);

// Finish recording.
router.patch("/:interviewId/complete", completeReplayController);

module.exports = router;

