const express = require("express");
const { 
    registerUser,
    loginUser,
    getCurrentUser
 } = require("../controllers/authController");

 const protect = require("../middleware/authMiddleware");
 const validate= require("../middleware/validateMiddleware");
 const { registerSchema, loginSchema } = require("../schemas/authSchema");

const {authLimiter} = require("../middleware/rateLimitMiddleware");

 const router = express.Router();


router.post("/register", authLimiter, validate(registerSchema), registerUser);
router.post("/login", authLimiter, validate(loginSchema), loginUser);
router.get("/me",protect, getCurrentUser);


module.exports = router;