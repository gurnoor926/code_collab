const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    runCodeAgainstExamples,
    submitCode,
    getMySubmissions,
    getSubmissionById,
    getInterviewSubmissions,
} = require("../controllers/submissionController");

router.use(protect);

router.post("/run", runCodeAgainstExamples);

router.post("/submit", submitCode);

router.get("/my", getMySubmissions);

router.get("/interview/:interviewId", getInterviewSubmissions);

router.get("/:id", getSubmissionById);

module.exports = router;