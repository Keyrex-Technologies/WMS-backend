// routes/attendance.js

import { Router } from "express";

import { markAttendance, getPayroll, getTodayAttendance } from "../controllers/attendanceController.js";
const router = Router();


router.post('/mark', markAttendance);
router.get('/payroll/:employeeId', getPayroll);
router.get('/attendance/today', getTodayAttendance);

export default router;
