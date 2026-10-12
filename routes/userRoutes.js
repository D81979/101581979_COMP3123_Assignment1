const express = require("express");
const { signup } = require("../controllers/userController");
const { login } = require("../controllers/loginController");
const {
  signupRules,
  validate,
} = require("../validators/userValidators");
const { loginRules } = require("../validators/loginValidators");

const router = express.Router();

// Validate signup details, then create the user
router.post("/signup", signupRules, validate, signup);

// Validate login details, then check credentials
router.post("/login", loginRules, validate, login);

module.exports = router;