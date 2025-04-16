import express from "express";
import {
  // updateUserRole,
  // updateHourlyRate,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  // getEmployeeStatus,
  getAllEmployees,
  getEmployeeById,
} from "../controllers/admin.controller.js";
import { authenticateToken, checkRole } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken, checkRole("admin"));

// add employee
router.post("/add-employee", addEmployee);

// employee employee
router.put("/update-employee/:employeeId", updateEmployee);

// remove employee
router.delete("/remove-employees/:employeeId", deleteEmployee);

// get employee data
router.get("/get-employee/:employeeId", getEmployeeById);

// get all employees
router.get("/get-all-employees", getAllEmployees);





// Update user role (admin/manager/employee)
// router.patch("/users/:userId/role", updateUserRole);

// Update user's hourly wage rate
// router.patch("/users/:userId/rate", updateHourlyRate);

export default router;
