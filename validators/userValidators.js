const {
  body,
  checkExact,
  validationResult,
} = require("express-validator");

// Rules for creating an account
const signupRules = [
  body("username")
    .isString()
    .withMessage("Username is required")
    .bail()
    .trim()
    .toLowerCase()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must contain 3–30 characters")
    .matches(/^[a-z0-9_]+$/)
    .withMessage("Use only letters, numbers, and underscores"),

  body("email")
    .isString()
    .withMessage("Email is required")
    .bail()
    .trim()
    .toLowerCase()
    .isLength({ max: 254 })
    .withMessage("Email is too long")
    .isEmail()
    .withMessage("Enter a valid email address"),

  body("password")
    .isString()
    .withMessage("Password is required")
    .bail()
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password needs at least 8 characters, uppercase, lowercase, a number, and a symbol"
    )
    .custom((value) => Buffer.byteLength(value, "utf8") <= 72)
    .withMessage("Password must not exceed 72 bytes"),

  // Reject extra fields that we did not expect
  checkExact([], {
    locations: ["body", "query"],
    message: "Unexpected fields were provided",
  }),
];

// Return helpful errors without exposing input values
function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.path || "request",
        message: error.msg,
      })),
    });
  }

  // Continue when the input is valid
  next();
}

module.exports = { signupRules, validate };