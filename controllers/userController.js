const User = require("../models/User");

async function signup(req, res, next) {
  try {
    const { username, email, password } = req.body;

    // Check whether the username or email is already used
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    // The User model hashes the password before saving
    const user = await User.create({
      username,
      email,
      password,
    });

    // Return only safe user information
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    // Handle duplicate signups arriving at the same time
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    next(error);
  }
}

module.exports = { signup };