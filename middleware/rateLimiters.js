const { rateLimit } = require("express-rate-limit");
const MongoRateLimitStore = require("../utils/MongoRateLimitStore");

// Limit general API traffic per IP.
const apiLimiter = rateLimit({
  store: new MongoRateLimitStore("api"),
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again after 15 minutes.",
  },
});

// Use a stricter limit for signup and login.
const authLimiter = rateLimit({
  store: new MongoRateLimitStore("auth"),
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
});

module.exports = { apiLimiter, authLimiter };
