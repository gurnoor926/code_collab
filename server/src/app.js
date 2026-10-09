const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes")

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
app.use("/api/test", testRoutes);


//keep after all routes
app.use(notFound);
app.use(errorHandler);

module.exports = app;