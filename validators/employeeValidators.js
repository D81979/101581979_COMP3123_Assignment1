const { body, param, query, checkExact } = require("express-validator");

// Reuse these rules for required text fields
function requiredText(field, maxLength) {
  return body(field)
    .isString()
    .withMessage(`${field} must be text`)
    .bail()
    .trim()
    .isLength({ min: 1, max: maxLength })
    .withMessage(`${field} must contain 1–${maxLength} characters`);
}

// Check employee details when creating or updating
function employeeBodyRules() {
  return [
    requiredText("first_name", 50),
    requiredText("last_name", 50),
    requiredText("position", 100),
    requiredText("department", 100),

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

    body("salary")
      .custom(
        (value) =>
          typeof value === "number" &&
          Number.isFinite(value) &&
          value > 0
      )
      .withMessage("Salary must be a positive JSON number"),

    body("date_of_joining")
      .isString()
      .withMessage("Date of joining is required")
      .bail()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("Use the date format YYYY-MM-DD")
      .bail()
      .isISO8601({ strict: true })
      .withMessage("Enter a valid calendar date"),
  ];
}

// Reject unexpected fields, including a client-supplied owner
function rejectExtraFields() {
  return checkExact([], {
    locations: ["body", "params", "query"],
    message: "Unexpected fields were provided",
  });
}

// POST /employees
const createEmployeeRules = [
  ...employeeBodyRules(),
  rejectExtraFields(),
];

// GET /employees/:eid
const employeeIdRules = [
  param("eid")
    .isMongoId()
    .withMessage("Employee ID must be a valid MongoDB ObjectId"),
  rejectExtraFields(),
];

// PUT /employees/:eid — send all editable employee fields
const updateEmployeeRules = [
  param("eid")
    .isMongoId()
    .withMessage("Employee ID must be a valid MongoDB ObjectId"),
  ...employeeBodyRules(),
  rejectExtraFields(),
];

// DELETE /employees?eid=...
const deleteEmployeeRules = [
  query("eid")
    .isMongoId()
    .withMessage("Employee ID must be a valid MongoDB ObjectId"),
  rejectExtraFields(),
];

// GET /employees — no extra input is needed
const listEmployeeRules = [rejectExtraFields()];

module.exports = {
  createEmployeeRules,
  employeeIdRules,
  updateEmployeeRules,
  deleteEmployeeRules,
  listEmployeeRules,
};