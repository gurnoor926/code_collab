
const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  getEvaluation,
  submitEvaluation,
  getEvaluationDashboard,
} = require("../controllers/evaluationController");

router.use(protect);

// Keep this route BEFORE /:interviewId.
router.get("/dashboard", getEvaluationDashboard);

router.get("/:interviewId", getEvaluation);

router.post("/:interviewId/submit", submitEvaluation);

module.exports = router;
