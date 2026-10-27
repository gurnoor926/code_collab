const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const problemRoutes = require("./routes/problemRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const executionRoutes = require("./routes/executionRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const testCaseRoutes = require("./routes/testCaseRoutes");
const replayRoutes = require("./routes/replayRoutes");
const evaluationRoutes = require("./routes/evaluationRoutes");
///const testRoutes = require("./routes/testRoutes")

const {
    notFound,
    errorHandler
}  = require("./middleware/errorMiddleware");

const app = express();

// Security
app.use(helmet());

// CORS
app.use(cors());

// Request logging
app.use(morgan("dev"));

// Parse JSON
app.use(express.json({limit: "20kb"}));

// Parse URL encoded data
app.use(express.urlencoded({ extended: true, limit:"20kb" }));

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/problems",problemRoutes);
app.use("/api/interviews",interviewRoutes);
app.use("/api/execution",executionRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/test-cases", testCaseRoutes);
app.use("/api/replays", replayRoutes);
app.use("/api/evaluations", evaluationRoutes);
//app.use("/api/test", testRoutes);


//keep after all routes
app.use(notFound);
app.use(errorHandler);

module.exports = app;