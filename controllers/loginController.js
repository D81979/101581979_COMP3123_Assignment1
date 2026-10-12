const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function login(req, res, next) {
  try {
    const { username, email, password } = req.body;

    // Search using the provided username or email
    const filter = username ? { username } : { email };

    // Include the password hash for this comparison only
    const user = await User.findOne(filter).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Compare the entered password with the saved hash
    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Require a secret before creating a token
    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
      throw new Error("JWT secret is missing or too short");
    }

    // Put the authenticated user's ID in the token
    const token = jwt.sign({}, secret, {
      algorithm: "HS256",
      subject: user._id.toString(),
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });

    // Prevent caching of the login response
    res.set("Cache-Control", "no-store");

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { login };