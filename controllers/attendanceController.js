// controllers/attendanceController.js

import AttendanceModel from "../models/Attendance.model.js";
import AttendenceHistory from "../models/AttendenceHistory.model.js";
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
        const attendanceHistory = await AttendenceHistory
            .find({})
            .sort({ date: -1 }); // sort by date, newest first
        
        return res.json({ 
            success: true,
            attendance: attendanceHistory || []
        });
        
    } catch (err) {
        console.error("Error in getAllAttendance:", err);
        res.status(500).json({ 
            success: false,
            error: "Failed to fetch attendance history",
            message: err.message 
        });
    }
};

export const getAllEmployeesAttendencePayroll = async (req, res) => {
    try {
        const month = req.query.month || new Date().getMonth() + 1; // Default to current month
        const year = new Date().getFullYear();

        if (month < 1 || month > 12) {
            return res.status(400).json({
                success: false,
                error: "Invalid month - must be between 1 and 12"
            });
        }

        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0); // Last day of the month

        const attendanceHistory = await AttendenceHistory
            .find({
                date: {
                    $gte: startOfMonth,
                    $lte: endOfMonth
                }
            })
            .sort({ date: -1 }); // sort by date, newest first
        
        const payroll = await Promise.all(attendanceHistory.map(async (record) => {
            const employee = await User.findOne({ employeeId: record.employeeId });
            return {
                ...record._doc,
                employeeName: employee?.name,
                employeeId: record.employeeId,
                role: employee?.role || 'employee',
                date: formatDate(record.date),
                status: record.status,
                working_hours: record.working_hours,
                daily_salary: employee?.wagePerHour * record.working_hours || 0,  
            };
        }));

        return res.json({ 
            success: true,
            month: month,
            attendance: payroll || []
        });
        
    } catch (err) {
        console.error("Error in getting attendence history with payroll:", err);
        res.status(500).json({ 
            success: false,
            error: "Failed to fetch attendence history with payroll",
            message: err.message 
        });
    }
}

export const getAllEmployeeAttendencePayroll = async (req, res) => {
    try {
        const { employeeId } = req.query;
        const month = req.query.month || new Date().getMonth() + 1; // Default to current month
        const year = new Date().getFullYear();

        if (
            !employeeId ||
            typeof employeeId !== "string" ||
            employeeId.trim() === ""
        ) {
            return res.status(400).json({
                error: "Invalid employee ID - must be a non-empty string",
            });
        }

        if (month < 1 || month > 12) {
            return res.status(400).json({
                success: false,
                error: "Invalid month - must be between 1 and 12"
            });
        }

        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);

        const attendanceHistory = await AttendenceHistory.find({
            userId: employeeId,
            date: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        }).sort({ date: -1 }); // sort by date, newest first

        console.log(attendanceHistory)
        
        const payroll = await Promise.all(attendanceHistory.map(async (record) => {
            const employee = await User.findOne({ employeeId: record.employeeId });
            return {
                ...record._doc,
                employeeName: employee?.name,
                employeeId: record.employeeId,
                role: employee?.role || 'employee',
                date: formatDate(record.date),
                status: record.status,
                working_hours: record.working_hours,
                daily_salary: employee?.wagePerHour * record.working_hours || 0,  
            };
        }));

        return res.json({ 
            success: true,
            month: month,
            attendance: payroll || []
        });
        
    } catch (err) {
        console.error("Error in getting attendence history with payroll:", err);
        res.status(500).json({ 
            success: false,
            error: "Failed to fetch attendence history with payroll",
            message: err.message 
        });
    }
}

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
export const socketCheckIn = async (data) => {
    try {
        const { userId, date } =data;

        const employee = await User.findById(userId);
        if (!employee) {
            return {
                success: false,
                message: "Employee not found",
            };
        }
        const employeeName = employee.name;
        const email = employee.email;

        const today = new Date(date || new Date());
        today.setHours(0, 0, 0, 0);

        // Find if the employee already has an attendance record for today
        let attendance = await AttendanceModel.findOne({
            userId,
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        // Don't process duplicate check-ins
        if (attendance && attendance.status === "in") {
            return {
                success: false,
                message: "Already checked in"
            };
        }

        const currentTime = new Date();

        if (attendance) {
            // Update existing record
            attendance.current_checkin_time = currentTime;
            attendance.status = "in";
            await attendance.save();
        } else {
            // Create new record
            attendance = await AttendanceModel.create({
                userId,
                employeeId: employee.employeeId,
                employeeName,
                email,
                date: today,
                checkin_time: currentTime,
                current_checkin_time: currentTime,
                status: "in",
            });
        }

        return {
            success: true,
            data: attendance,
            message: "Check-in successful"
        };
    } catch (error) {
        console.error("Error during check-in:", error);
        return {
            success: false,
            message: "Check-in failed",
            error: error.message
        };
    };
};

// Handle socket check-out
export const socketCheckOut = async (data) => {
    try {
        const { userId, date } = data;

        // Format date to remove time portion to find today's record
        const today = new Date(date || new Date());
        today.setHours(0, 0, 0, 0);

        // Find the employee's attendance record for today
        const attendance = await AttendanceModel.findOne({
            userId,
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (!attendance) {
            return {
                success: false,
                message: "No check-in record found for today"
            };
        }

        // Don't process duplicate check-outs
        if (attendance.status === "out") {
            return {
                success: false,
                message: "Already checked out"
            };
        }

        // Check if check-in exists
        if (!attendance.current_checkin_time) {
            return {
                success: false,
                message: "Must check in before checking out"
            };
        }

        const currentTime = new Date();

        // since it's the same day
        // we can just subtract timestamps directly
        const diffMs = currentTime - attendance.current_checkin_time;

        console.log(diffMs)
        
        // Calculate minutes first
        const minutesWorked = Math.floor(diffMs / (1000 * 60));
        
        // Convert to hours for storage (as per the schema)
        const hoursWorked = minutesWorked / 60;

        // Update the record
        attendance.checkout_time = currentTime;
        attendance.status = "out";
        attendance.working_hours += parseFloat(hoursWorked.toFixed(2));

        await attendance.save();

        return {
            success: true,
            data: {
                ...attendance._doc,
                minutes_worked: minutesWorked,
            },
            message: "Check-out successful"
        };
    } catch (error) {
        console.error("Socket check-out error:", error);
        return {
            success: false,
            message: error.message
        };
    }
};
