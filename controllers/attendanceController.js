// controllers/attendanceController.js

import AttendanceModel from "../models/Attendance.model.js";
import User from "../models/users.model.js";
import { calculatePayroll } from "../utils/payroll.js";

// Mark attendance
export const markAttendance = async (req, res) => {
    try {
        const { employeeId, type, status } = req.body;
        console.log("Request body:", req.body);

        // Validate required fields
        if (!employeeId || !type || !status) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                required: ['employeeId', 'type', 'status']
            });
        }

        // Trim and validate input strings
        const trimmedEmployeeId = employeeId.trim();
        const trimmedType = type.trim().toLowerCase();
        const trimmedStatus = status.trim().toLowerCase();

        if (!trimmedEmployeeId || !trimmedType || !trimmedStatus) {
            return res.status(400).json({
                success: false,
                error: 'Fields cannot be empty or whitespace only'
            });
        }

        // Find employee by custom employeeId
        const employee = await User.findOne({ employeeId: trimmedEmployeeId });
        if (!employee) {
            return res.status(404).json({
                success: false,
                error: 'Employee not found',
                searchedId: trimmedEmployeeId
            });
        }

        // Check if employee is active
        if (employee.status === 'inactive') {
            return res.status(400).json({
                success: false,
                error: 'Employee account is inactive',
                employeeName: employee.name,
                employeeId: employee.employeeId
            });
        }

        // Validate attendance type and status
        const validTypes = ['check-in', 'check-out', 'break-start', 'break-end'];
        const validStatuses = ['present', 'late', 'half-day', 'on-leave'];

        if (!validTypes.includes(trimmedType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid attendance type',
                validTypes,
                receivedType: trimmedType
            });
        }

        if (!validStatuses.includes(trimmedStatus)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid attendance status',
                validStatuses,
                receivedStatus: trimmedStatus
            });
        }

        // Create timestamp
        const timestamp = new Date();
        const dateString = timestamp.toLocaleDateString();
        const timeString = timestamp.toLocaleTimeString();

        // Check for existing check-in if marking check-out
        if (trimmedType === 'check-out') {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const existingCheckIn = await AttendanceModel.findOne({
                employeeId: trimmedEmployeeId,
                type: 'check-in',
                timestamp: { $gte: todayStart }
            });

            if (!existingCheckIn) {
                return res.status(400).json({
                    success: false,
                    error: 'Cannot check out without checking in first',
                    employeeId: trimmedEmployeeId,
                    employeeName: employee.name
                });
            }
        }

        // Create attendance record
        const attendanceRecord = new AttendanceModel({
            employeeId: employee.employeeId,
            employeeName: employee.name,
            type: trimmedType,
            status: trimmedStatus,
            role: employee.role,
            department: employee.department || 'Unassigned',
            date: dateString,
            time: timeString,
            timestamp
        });

        await attendanceRecord.save();

        // Prepare response
        const response = {
            success: true,
            message: `${trimmedType} recorded successfully`,
            record: {
                id: attendanceRecord._id,
                employeeId: employee.employeeId,
                employeeName: employee.name,
                type: trimmedType,
                status: trimmedStatus,
                date: dateString,
                time: timeString,
                timestamp
            }
        };

        res.status(201).json(response);

    } catch (error) {
        console.error('Attendance recording error:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.message
            });
        }

        res.status(500).json({
            success: false,
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
        const { employeeId } = req.query;
        console.log("employeeId", employeeId);
        // Basic validation - check if string is not empty
        if (
            !employeeId ||
            typeof employeeId !== "string" ||
            employeeId.trim() === ""
        ) {
            return res.status(400).json({
                error: "Invalid employee ID - must be a non-empty string",
            });
        }
        const { daily, weekly, monthly } = await calculatePayroll(employeeId);
        res.json({ daily, weekly, monthly });
    } catch (err) {
        console.log(err);
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
        console.log("first")
        // Get current date in local timezone
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));

        // Get all attendance records for today
        const attendanceRecords = await AttendanceModel.find({
            timestamp: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).sort({ timestamp: 1 }); // Sort by timestamp ascending

        // Transform records to include employee details
        const detailedRecords = await Promise.all(
            attendanceRecords.map(async (record) => {
                const employee = await User.findOne({
                    employeeId: record.employeeId
                });

                return {
                    id: record._id,
                    employeeId: record.employeeId,
                    name: employee?.name || 'Unknown Employee',
                    type: record.type,
                    status: record.status,
                    department: employee?.department || 'Unassigned',
                    timestamp: record.timestamp,
                    formattedTime: formatTime(record.timestamp),
                    formattedDate: formatDate(record.timestamp)
                };
            })
        );

        res.status(200).json({
            date: formatDate(startOfDay),
            totalRecords: detailedRecords.length,
            records: detailedRecords
        });

    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({
            error: 'Failed to fetch attendance',
            message: process.env.NODE_ENV === 'development'
                ? error.message
                : 'Internal server error'
        });
    }
};

// Helper functions
function formatTime(date) {
    return new Date(date).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function formatDate(date) {
    return new Date(date).toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

export const getAllAttendance = async (req, res) => {
    try {
        const todayAttendance = await AttendanceModel.find();
        if (!todayAttendance && todayAttendance.length < 1) {
            return res.json({ attendance: [] });
        } else {
            return res.json({ attendance: todayAttendance });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
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
            role: "employee",
            isActive: true,
        });

        // Get today's attendance records
        const todayAttendance = await AttendanceModel.find({
            date: {
                $gte: startOfDay,
                $lte: endOfDay,
            },
        });

        // Calculate stats
        const presentCount = todayAttendance.filter(
            (a) => a.status !== "Absent"
        ).length;
        const attendancePercentage =
            totalEmployees > 0
                ? Math.round((presentCount / totalEmployees) * 100)
                : 0;

        res.json({
            totalEmployees,
            attendancePercentage,
            presentCount,
            absentCount: totalEmployees - presentCount,
            summary: `${attendancePercentage}% (${presentCount}/${totalEmployees} employees present)`,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch attendance stats" });
    }
};

// get employee attendence
export const getEmployeeAttendance = async (req, res) => {
    console.log("getEmployeeAttendance")
    try {
        // Get today's date range
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Get all employees and their attendance
        const employees = await User.find({
            role: "employee",
            isActive: true,
        }).select("name employeeId");

        const attendanceRecords = await AttendanceModel.find({
            date: {
                $gte: startOfDay,
                $lte: endOfDay,
            },
        });

        // Map employee data with attendance
        const result = employees.map((employee) => {
            const record = attendanceRecords.find(
                (r) => r.employeeId.toString() === employee._id.toString()
            );

            return {
                employeeId: employee.employeeId,
                name: employee.name,
                clockIn: record?.clockIn || "Not clocked in",
                clockOut: record?.clockOut || "Not clocked out",
                status: record?.status || "Absent",
            };
        });

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch employee attendance" });
    }
};



// Socket-enabled controller methods
export const socketCheckIn = async (req) => {
    const { employeeId, employeeName, email, role } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Check for existing check-in
    const existing = await Attendance.findOne({
        email,
        date: today,
        checkin_time: { $ne: null },
        checkout_time: null
    });

    if (existing) {
        throw new Error('You have already checked in today');
    }

    const attendance = new Attendance({
        employeeId,
        employeeName,
        email,
        role,
        status: 'present',
        date: today,
        checkin_time: new Date(),
        working_hours: 0
    });

    await attendance.save();

    return {
        success: true,
        message: 'Check-in recorded successfully',
        attendance
    };
};

export const socketCheckOut = async (req) => {
    const { email } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findOne({
        email,
        date: today,
        checkin_time: { $ne: null },
        checkout_time: null
    });

    if (!attendance) {
        throw new Error('No active check-in found for today');
    }

    const checkoutTime = new Date();
    const workingHours = (checkoutTime - attendance.checkin_time) / (1000 * 60 * 60);

    attendance.checkout_time = checkoutTime;
    attendance.working_hours = workingHours;

    if (workingHours < 4) {
        attendance.status = 'half-day';
    }

    await attendance.save();

    return {
        success: true,
        message: 'Check-out recorded successfully',
        attendance
    };
};
