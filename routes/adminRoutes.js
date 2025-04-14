// routes/adminRoutes.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { checkRole } from '../middleware/auth.js';
import { updateUserRole, updateHourlyRate, addEmployee, updateEmployee, deleteEmployee, getEmployeeStatus } from '../controllers/adminController.js';

const router = express.Router();

// emplyee update and delete routes
router.put('/employees/:employeeId', updateEmployee);
router.delete('/employees/:employeeId', deleteEmployee);

// Get employee status
router.get('/employees/status/:employeeId', getEmployeeStatus);

// Only admin can access these routes
router.use(authenticateToken, checkRole('admin'));

router.post('/add-employee', addEmployee);

// Update user role
router.patch('/users/:userId/role', updateUserRole);

// Update hourly rate
router.patch('/users/:userId/rate', updateHourlyRate);

export default router;