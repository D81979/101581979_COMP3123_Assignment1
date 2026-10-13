const Employee = require("../models/Employee");
const { matchedData } = require("express-validator");

// Explain why an employee was not accessible
async function handleUnavailableEmployee(id, res) {
  const exists = await Employee.exists({ _id: id });

  if (exists) {
    return res.status(403).json({
      success: false,
      message: "You cannot access another user's employee",
    });
  }

  return res.status(404).json({
    success: false,
    message: "Employee not found",
  });
}

// GET all employees belonging to the logged-in user
async function getEmployees(req, res, next) {
  try {
    const employees = await Employee.find({
      user: req.user._id,
    }).sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      employees,
    });
  } catch (error) {
    next(error);
  }
}

// POST a new employee
async function createEmployee(req, res, next) {
  try {
    // Use only fields that passed body validation
    const data = matchedData(req, { locations: ["body"] });

    const employee = await Employee.create({
      ...data,
      // Ownership always comes from the verified login
      user: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee,
    });
  } catch (error) {
    next(error);
  }
}

// GET one employee by ID
async function getEmployeeById(req, res, next) {
  try {
    // Both the employee ID and owner must match
    const employee = await Employee.findOne({
      _id: req.params.eid,
      user: req.user._id,
    });

    if (!employee) {
      return await handleUnavailableEmployee(req.params.eid, res);
    }

    return res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    next(error);
  }
}

// PUT updated details for an owned employee
async function updateEmployee(req, res, next) {
  try {
    const data = matchedData(req, { locations: ["body"] });

    // Keep the ownership check inside the update query
    const employee = await Employee.findOneAndUpdate(
      {
        _id: req.params.eid,
        user: req.user._id,
      },
      { $set: data },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!employee) {
      return await handleUnavailableEmployee(req.params.eid, res);
    }

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      employee,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE an owned employee using the query-string ID
async function deleteEmployee(req, res, next) {
  try {
    const employee = await Employee.findOneAndDelete({
      _id: req.query.eid,
      user: req.user._id,
    });

    if (!employee) {
      return await handleUnavailableEmployee(req.query.eid, res);
    }

    // A 204 response must have no response body
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getEmployees,
  createEmployee,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
};