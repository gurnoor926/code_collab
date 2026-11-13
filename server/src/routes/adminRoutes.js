const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  getAdminStats,
  getAdminUsers,
  getAdminInterviews,
  getAdminSubmissions,
} = require("../controllers/adminController");

// All routes require authentication and admin role
router.use(protect);
router.use(authorizeRoles("admin"));

router.get("/stats", getAdminStats);
router.get("/users", getAdminUsers);
router.get("/interviews", getAdminInterviews);
router.get("/submissions", getAdminSubmissions);

module.exports = router;

