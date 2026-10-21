const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createTestCase,
    getProblemTestCases,
    updateTestCase,
    deleteTestCase,
} = require("../controllers/testCaseController");

// Every endpoint requires authentication and the admin role.
router.use(protect);
router.use(authorizeRoles("admin"));

// Create a test case for a problem.
router.post("/problem/:problemId", createTestCase);

// Get all test cases for a problem, including hidden cases.
router.get("/problem/:problemId", getProblemTestCases);

// Update a test case.
router.patch("/:id", updateTestCase);

// Delete a test case.
router.delete("/:id", deleteTestCase);

module.exports = router;