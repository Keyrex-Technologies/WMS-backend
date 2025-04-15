// routes/attendance.js

import { Router } from "express";

import { markAttendance, getPayroll, getTodayAttendance, getAttendanceStats, getEmployeeAttendance, getAllAttendance } from "../controllers/attendanceController.js";

// import AttendanceController from '../controllers/attendance.controller.js';
// import { getIO } from "../utils/socketService.js";

const router = Router();

// router.post('/check-in', async (req, res) => {
//     try {
//         const result = await AttendanceController.checkIn(req.body);

//         // Emit socket event
//         const io = getIO();
//         io.emit('attendance-update', {
//             type: 'check-in',
//             user: req.user, // Assuming you have user data from auth middleware
//             data: result,
//             time: new Date()
//         });

//         res.status(200).json(result);
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// });

// router.post('/check-out', async (req, res) => {
//     try {
//         const result = await AttendanceController.checkOut(req.body);

//         const io = getIO();
//         io.emit('attendance-update', {
//             type: 'check-out',
//             user: req.user,
//             data: result,
//             time: new Date()
//         });

//         res.status(200).json(result);
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// });


router.post('/mark', markAttendance);
router.get('/payroll/:employeeId', getPayroll);
router.get('/today', getTodayAttendance);

// Attendance routes
router.get('/stats', getAttendanceStats);

router.get('/today', getEmployeeAttendance);

router.get('/get-all-attendance', getAllAttendance);

export default router;
