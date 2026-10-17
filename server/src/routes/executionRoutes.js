const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    runCode,
    getCodeResult,
} = require("../controllers/executionController");

const executionLimiter = rateLimit({
    windowMs : 60 * 1000,
    limit : 5,
    standardHeaders: "draft-8",
    legacyHeaders : false,
    message :{
        success:false,
        message: "Too many execution requests. Please try again later",
    },
});

router.post("/run", protect,executionLimiter, runCode);
router.get("/result/:token",protect,getCodeResult);

module.exports = router;