// controllers/attendanceController.js

import AttendanceModel from "../models/Attendance.model.js";
import User from "../models/User.js";
import { calculatePayroll } from "../utils/payroll.js";




// Mark attendance
export const markAttendance = async (req, res) => {
    try {
        const { employeeId, type, status } = req.body;
        console.log("req.body", req.body)
        // Validate required fields
        if (!employeeId || !type || !status) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['employeeId', 'type', 'status']
            });
        }

        // Find employee by either MongoDB _id or custom employeeId
        const employee = await User.findOne({
            $or: [
                // { _id: employeeId },          // Try as MongoDB ID
                { employeeId: employeeId }     // Try as custom employee ID
            ]
        });

        if (!employee) {
            return res.status(404).json({
                error: 'Employee not found',
                searchedId: employeeId,
                suggestion: 'Try with either MongoDB _id or employeeId (like KCH-0456)'
            });
        }

        // Check if employee is active
        if (employee.status === 'inactive') {
            return res.status(400).json({
                error: 'Employee account is inactive',
                employeeName: employee.name,
                employeeId: employee.employeeId, // Return the custom ID
                mongoId: employee._id             // Return MongoDB ID for reference
            });
        }

        // Validate attendance type and status
        const validTypes = ['check-in', 'check-out', 'break-start', 'break-end'];
        const validStatuses = ['present', 'late', 'half-day', 'on-leave', 'Absent'];

        if (!validTypes.includes(type)) {
            return res.status(400).json({
                error: 'Invalid attendance type',
                validTypes,
                receivedType: type
            });
        }

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Invalid attendance status',
                validStatuses,
                receivedStatus: status
            });
        }

        // Create attendance record
        const attendanceRecord = new AttendanceModel({
            employeeId: employee.employeeId, // Store custom ID (KCH-0456)
            type,
            status,
            role: employee.role,
            employeeName: employee.name,
            department: employee.department || 'Unassigned'
        });

        await attendanceRecord.save();

        // Successful response
        res.status(201).json({
            success: true,
            message: 'Attendance recorded successfully',
            record: {
                id: attendanceRecord._id,
                employeeId: employee.employeeId, // Return the custom ID
                employeeName: employee.name,
                type,
                status,
                time: attendanceRecord.createdAt
            }
        });

    } catch (error) {
        console.error('Attendance recording error:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.message
            });
        }

        res.status(500).json({
            error: 'Failed to record attendance',
            message: process.env.NODE_ENV === 'development'
                ? error.message
                : 'Internal server error'
        });
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
// export const getTodayAttendance = async (req, res) => {
//     try {
//         // Get today's date at midnight (start of day)
//         const startOfDay = new Date();
//         startOfDay.setHours(0, 0, 0, 0);

//         // Get end of today (just before midnight)
//         const endOfDay = new Date();
//         endOfDay.setHours(23, 59, 59, 999);

//         // Query attendance records for today
//         const todayAttendance = await AttendanceModel.find({
//             createdAt: {
//                 $gte: startOfDay,
//                 $lt: endOfDay
//             }
//         }).sort({ createdAt: -1 }); // Sort by most recent first

//         res.json(todayAttendance);
//     } catch (err) {
//         console.log(err);
//         res.status(500).json({ error: err.message });
//     }
// };

// export const getEmployeeAttendance = async (req, res) => {
//     try {
//         const { employeeId } = req.params;

//         // Get today's date range
//         const startOfDay = new Date();
//         startOfDay.setHours(0, 0, 0, 0);

//         const endOfDay = new Date();
//         endOfDay.setHours(23, 59, 59, 999);

//         // Query attendance for specific employee today
//         const employeeAttendance = await AttendanceModel.find({
//             employeeId: employeeId,
//             createdAt: {
//                 $gte: startOfDay,
//                 $lt: endOfDay
//             }
//         }).sort({ createdAt: -1 });

//         if (!employeeAttendance.length) {
//             return res.status(404).json({ message: 'No attendance records found for this employee today' });
//         }

//         res.json(employeeAttendance);
//     } catch (err) {
//         console.log(err);
//         res.status(500).json({ error: err.message });
//     }
// };

export const getTodayAttendance = async (req, res) => {
    try {
        // Get today's date range
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Get all employees first
        const allEmployees = await User.find({ role: 'employee' });

        // 2. Get today's attendance records
        const todayAttendance = await AttendanceModel.find({
            createdAt: { $gte: startOfDay, $lt: endOfDay }
        }).sort({ createdAt: -1 });

        // 3. Transform into the desired format
        const attendanceSummary = allEmployees.map(employee => {
            // Find all attendance records for this employee today
            const employeeRecords = todayAttendance.filter(
                record => record.employeeId === employee.employeeId ||
                    record.employeeId === employee._id.toString()
            );

            // Find clock-in and clock-out records
            const clockInRecord = employeeRecords.find(r => r.type === 'check-in');
            const clockOutRecord = employeeRecords.find(r => r.type === 'check-out');

            // Determine status
            let status = 'Absent';
            if (clockInRecord) {
                status = clockOutRecord ? 'Present' : 'Working';
            }

            return {
                employeeId: employee.employeeId,
                name: employee.name,
                clockIn: clockInRecord
                    ? clockInRecord.createdAt.toLocaleTimeString()
                    : 'Not clocked in',
                clockOut: clockOutRecord
                    ? clockOutRecord.createdAt.toLocaleTimeString()
                    : 'Not clocked out',
                status: status,
                records: employeeRecords // Optional: include all raw records
            };
        });

        res.json(attendanceSummary);
    } catch (err) {
        console.error('Error fetching attendance:', err);
        res.status(500).json({
            error: 'Failed to fetch attendance',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

//get stats
export const getAttendanceStats = async (req, res) => {
    try {
        // Get today's date range
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Get total employee count
        const totalEmployees = await User.countDocuments({
            role: 'employee',
            isActive: true
        });

        // Get today's attendance records
        const todayAttendance = await AttendanceModel.find({
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        // Calculate stats
        const presentCount = todayAttendance.filter(a => a.status !== 'Absent').length;
        const attendancePercentage = totalEmployees > 0
            ? Math.round((presentCount / totalEmployees) * 100)
            : 0;

        res.json({
            totalEmployees,
            attendancePercentage,
            presentCount,
            absentCount: totalEmployees - presentCount,
            summary: `${attendancePercentage}% (${presentCount}/${totalEmployees} employees present)`
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch attendance stats' });
    }
};

// get employee attendence
export const getEmployeeAttendance = async (req, res) => {
    try {
        // Get today's date range
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Get all employees and their attendance
        const employees = await User.find({
            role: 'employee',
            isActive: true
        }).select('name employeeId');

        const attendanceRecords = await AttendanceModel.find({
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        // Map employee data with attendance
        const result = employees.map(employee => {
            const record = attendanceRecords.find(r =>
                r.employeeId.toString() === employee._id.toString()
            );

            return {
                employeeId: employee.employeeId,
                name: employee.name,
                clockIn: record?.clockIn || 'Not clocked in',
                clockOut: record?.clockOut || 'Not clocked out',
                status: record?.status || 'Absent'
            };
        });

        res.json(result);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch employee attendance' });
    }
};

// module.exports = {
//     markAttendance,
//     getPayroll
// };



{
    "dailysalary"
    "empid"
    "empname"
    "checkin "
    "cout"
    "monthlySalary"
    "wageperhour"

}