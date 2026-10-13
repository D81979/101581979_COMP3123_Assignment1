const express = require("express");
const authenticate = require("../middleware/auth");
const { validate } = require("../validators/userValidators");

const {
  createEmployeeRules,
  employeeIdRules,
  updateEmployeeRules,
  deleteEmployeeRules,
  listEmployeeRules,
} = require("../validators/employeeValidators");

const {
  getEmployees,
  createEmployee,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");

const router = express.Router();

// Every employee route requires a valid JWT
router.use(authenticate);

// Get the logged-in user's employees
router.get(
  "/employees",
  listEmployeeRules,
  validate,
  getEmployees
);

// Create an employee for the logged-in user
router.post(
  "/employees",
  createEmployeeRules,
  validate,
  createEmployee
);

// Retrieve one owned employee
router.get(
  "/employees/:eid",
  employeeIdRules,
  validate,
  getEmployeeById
);

// Update one owned employee
router.put(
  "/employees/:eid",
  updateEmployeeRules,
  validate,
  updateEmployee
);

// Delete using /employees?eid=...
router.delete(
  "/employees",
  deleteEmployeeRules,
  validate,
  deleteEmployee
);

module.exports = router;