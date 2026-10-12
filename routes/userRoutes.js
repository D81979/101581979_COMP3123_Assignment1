const express = require("express");
const { signup } = require("../controllers/userController");
const {
  signupRules,
  validate,
} = require("../validators/userValidators");

const router = express.Router();

// Check the input, then create the user
router.post("/signup", signupRules, validate, signup);

module.exports = router;