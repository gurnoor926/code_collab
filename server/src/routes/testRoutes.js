const express = require("express");

const protect = require("../middleware/authMiddleware");

const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
    "/admin",
    protect,
    authorizeRoles("admin"),
    (req, res) => {
        res.json({
            success: true,
            message: "Welcome, Admin!"
        });
    }
);

router.get(
    "/interviewer",
    protect,
    authorizeRoles("interviewer", "admin"),
    (req, res) => {
        res.json({
            success: true,
            message: "Welcome, Interviewer!"
        });
    }
);

router.get(
    "/candidate",
    protect,
    authorizeRoles("candidate", "admin", "interviewer"),
    (req, res) => {
        res.json({
            success: true,
            message: "Authenticated user can access this route"
        });
    }
);

module.exports = router;