const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  getEvaluation,
  submitEvaluation,
} = require("../controllers/evaluationController");

router.use(protect);

router.get("/:interviewId", getEvaluation);

router.post("/:interviewId/submit", submitEvaluation);

module.exports = router;