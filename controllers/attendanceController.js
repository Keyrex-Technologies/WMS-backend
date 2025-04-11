// controllers/attendanceController.js

import AttendanceModel from "../models/Attendance.model.js";
import { calculatePayroll } from "../utils/payroll.js";




// Mark attendance
export const markAttendance = async (req, res) => {
    try {
        console.log("first")
        const { employeeId, type } = req.body;

        console.log(req.body)
        const newEntry = new AttendanceModel({ employeeId, type });
        await newEntry.save();
        res.json({ message: 'Attendance marked' });
    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message });
    }
};

// Calculate payroll
export const getPayroll = async (req, res) => {
    try {

        const { employeeId } = req.query
        console.log("employeeId", employeeId)
        // Basic validation - check if string is not empty
        if (!employeeId || typeof employeeId !== 'string' || employeeId.trim() === '') {
            return res.status(400).json({
                error: "Invalid employee ID - must be a non-empty string"
            });
        }
        const { daily, weekly, monthly } = await calculatePayroll(employeeId);
        res.json({ daily, weekly, monthly });
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: err.message });
    }
};


// Get today's attendance
export const getTodayAttendance = async (req, res) => {
    try {
        // Get today's date at midnight (start of day)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Get end of today (just before midnight)
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Query attendance records for today
        const todayAttendance = await AttendanceModel.find({
            createdAt: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        }).sort({ createdAt: -1 }); // Sort by most recent first

        res.json(todayAttendance);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
};

// module.exports = {
//     markAttendance,
//     getPayroll
// };
