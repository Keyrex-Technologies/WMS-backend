// controllers/attendanceController.js

import AttendanceModel from "../models/Attendance.model.js";
import User from "../models/User.js";
import { calculatePayroll } from "../utils/payroll.js";

// Mark attendance
export const markAttendance = async (req, res) => {
  try {
    console.log("first");
    const { employeeId, type } = req.body;

    console.log(req.body);
    const newEntry = new AttendanceModel({ employeeId, type });
    await newEntry.save();
    res.json({ message: "Attendance marked" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
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
    // Get today's date at midnight (start of day)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Get end of today (just before midnight)
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Query all attendance records for today
    const todayAttendance = await AttendanceModel.find({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    }).sort({ createdAt: -1 });

    res.json(todayAttendance);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

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

// module.exports = {
//     markAttendance,
//     getPayroll
// };

{
  ("dailysalary");
  ("empid");
  ("empname");
  ("checkin ");
  ("cout");
  ("monthlySalary");
  ("wageperhour");
}
