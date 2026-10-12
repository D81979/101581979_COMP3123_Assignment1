const { body, checkExact } = require("express-validator");

// Check login details before looking up the user
const loginRules = [
  body("username")
    .optional()
    .isString()
    .withMessage("Username must be text")
    .bail()
    .trim()
    .toLowerCase()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must contain 3–30 characters")
    .matches(/^[a-z0-9_]+$/)
    .withMessage("Invalid username format"),

  body("email")
    .optional()
    .isString()
    .withMessage("Email must be text")
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
    .notEmpty()
    .withMessage("Password cannot be empty")
    .custom((value) => Buffer.byteLength(value, "utf8") <= 72)
    .withMessage("Password must not exceed 72 bytes")
    .custom((value, { req }) => {
      const hasUsername = req.body.username !== undefined;
      const hasEmail = req.body.email !== undefined;

      // Accept exactly one login identifier
      if (hasUsername === hasEmail) {
        throw new Error("Provide either username or email, but not both");
      }

      return true;
    }),

  // Reject unexpected body fields and query parameters
  checkExact([], {
    locations: ["body", "query"],
    message: "Unexpected fields were provided",
  }),
];

module.exports = { loginRules };