require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Stop early if the JWT secret is missing or too short.
    if (
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32
    ) {
      throw new Error("JWT configuration is invalid");
    }

    await connectDB();
    logger.info("database_connected");

    const server = app.listen(PORT, () => {
      logger.info("server_started", { port: PORT });
      console.log(`Server running at http://localhost:${PORT}`);
    });

    server.on("error", () => {
      logger.error("server_listen_failed");
      process.exitCode = 1;
    });
  } catch (error) {
    // Keep database credentials out of logs.
    logger.error("startup_failed");

    console.error(
      "Startup failed. Check your .env, Atlas database user, and IP access."
    );

    process.exitCode = 1;
  }
}

startServer();