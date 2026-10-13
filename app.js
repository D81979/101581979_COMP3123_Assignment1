require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const connectDB = require("./config/db");

const userRoutes = require("./routes/userRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const requestLogger = require("./middleware/requestLogger");
const { apiLimiter, authLimiter } = require("./middleware/rateLimiters");
const logger = require("./utils/logger");

const app = express();

// Vercel forwards the real client IP through its proxy.
if (process.env.VERCEL) {
  app.set("trust proxy", 1);
}

// Add HTTP security headers.
app.use(helmet());

// Log requests, including rejected ones.
app.use(requestLogger);

// Vercel can load app.js without running server.js.
app.use("/api", async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT configuration is invalid");
    }
    await connectDB();
    next();
  } catch (error) {
    logger.error("api_initialization_failed");
    res.status(503).json({
      success: false,
      message: "Service temporarily unavailable",
    });
  }
});

// Limit API traffic before reading request bodies.
app.use("/api", apiLimiter);
app.use("/api/v1/user", authLimiter);

// Read JSON and limit request size.
app.use(express.json({ limit: "10kb" }));

// Confirm that the API is running.
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Employee API is running",
  });
});

// Connect user and employee routes.
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/emp", employeeRoutes);

// Return JSON for unknown URLs.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Handle errors consistently.
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // Handle malformed JSON.
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body",
    });
  }

  // Handle oversized requests.
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body is too large",
    });
  }

  // Handle duplicate database values.
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with those unique details already exists",
    });
  }

  // Handle model validation failures.
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Data does not meet the required validation rules",
    });
  }

  // Handle invalid database field formats.
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID or field format",
    });
  }

  // Handle other bad requests.
  if (err.status === 400) {
    return res.status(400).json({
      success: false,
      message: "Invalid request body",
    });
  }

  // Avoid logging error objects that might contain secrets.
  logger.error("unhandled_application_error", {
    method: req.method,
  });

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

module.exports = app;
