const fs = require("fs");
const path = require("path");
const winston = require("winston");

// Vercel only allows temporary file writes.
const logDirectory = process.env.VERCEL
  ? path.join("/tmp", "comp3123-logs")
  : path.join(__dirname, "..", "logs");

fs.mkdirSync(logDirectory, { recursive: true });

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logDirectory, "app.log"),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3,
    }),
    new winston.transports.Console(),
  ],
});

module.exports = logger;