// routes/attendance.js

import { Router } from "express";

import { markAttendance, getPayroll, getTodayAttendance, getAttendanceStats, getEmployeeAttendance, getAllAttendance } from "../controllers/attendanceController.js";
const router = Router();


router.post('/mark', markAttendance);
router.get('/payroll/:employeeId', getPayroll);
router.get('/attendance/today', getTodayAttendance);

// Attendance routes
router.get('/stats', getAttendanceStats);

router.get('/today', getEmployeeAttendance);

router.get('/get-all-attendance', getAllAttendance);

export default router;
