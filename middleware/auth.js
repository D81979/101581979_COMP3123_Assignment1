const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

async function authenticate(req, res, next) {
  const authorization = req.get("Authorization") || "";

  // Expect: Bearer followed by a token
  const match = authorization.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return res.status(401).json({
      success: false,
      message: "A Bearer token is required",
    });
  }

  const secret = process.env.JWT_SECRET;

  // Configuration problems are server errors
  if (!secret || secret.length < 32) {
    return next(new Error("JWT secret is missing or too short"));
  }

  let decoded;

  try {
    // Verify the signature and expiration
    decoded = jwt.verify(match[1], secret, {
      algorithms: ["HS256"],
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        error.name === "TokenExpiredError"
          ? "Token has expired. Please log in again"
          : "Invalid token",
    });
  }

  // The token must contain a valid user ID
  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof decoded.sub !== "string" ||
    !mongoose.isObjectIdOrHexString(decoded.sub)
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  try {
    // Make sure the account still exists
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists",
      });
    }

    // Let later functions access the authenticated user
    req.user = user;

    next();
  } catch (error) {
    // Pass database errors to the error handler
    next(error);
  }
}

module.exports = authenticate;