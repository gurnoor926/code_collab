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
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
///const testRoutes = require("./routes/testRoutes")

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Security
app.use(helmet());

// CORS
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as Postman.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error("Not allowed by CORS");
      error.statusCode = 403;
      return callback(error);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Request logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Parse JSON
app.use(express.json({ limit: "100kb" }));

// Parse URL encoded data
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/execution", executionRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/test-cases", testCaseRoutes);
app.use("/api/replays", replayRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
//app.use("/api/test", testRoutes);

//keep after all routes
app.use(notFound);
app.use(errorHandler);

module.exports = app;
