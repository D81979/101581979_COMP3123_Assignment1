const express = require("express");
const helmet = require("helmet");
const userRoutes = require("./routes/userRoutes");

const app = express();

// Add security headers
app.use(helmet());

// Read JSON request bodies
app.use(express.json({ limit: "10kb" }));

// Check whether the API is running
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Employee API is running",
  });
});

// Connect the user endpoints
app.use("/api/v1/user", userRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Handle errors in one place
app.use((err, req, res, next) => {
  const status = err.status === 400 ? 400 : 500;

  res.status(status).json({
    success: false,
    message:
      status === 400
        ? "Invalid request body"
        : "Internal server error",
  });
});

module.exports = app;