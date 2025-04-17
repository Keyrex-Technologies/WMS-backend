import AttendanceModel from "../models/Attendance.model.js";
import AttendenceHistory from "../models/AttendenceHistory.model.js";
import User from "../models/users.model.js";

export const getTodayAttendance = async (req, res) => {
  try {
    const attendance = await AttendanceModel.find();
    if (attendance.length > 0) {
      return res.status(200).json({ attendance });
    } else {
      return res.status(200).json({ attendance: [] });
    }
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({
      error: "Failed to fetch attendance",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

function formatDate(date) {
  return new Date(date).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const getAllAttendance = async (req, res) => {
  try {
    const attendanceHistory = await AttendenceHistory.find({}).sort({
      date: -1,
    }); // sort by date, newest first

    return res.json({
      success: true,
      attendance: attendanceHistory || [],
    });
  } catch (err) {
    console.error("Error in getAllAttendance:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch attendance history",
      message: err.message,
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
        error: "Invalid month - must be between 1 and 12",
      });
    }

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0); // Last day of the month

    const attendanceHistory = await AttendenceHistory.find({
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }).sort({ date: -1 }); // sort by date, newest first

    const payroll = await Promise.all(
      attendanceHistory.map(async (record) => {
        const employee = await User.findOne({ employeeId: record.employeeId });
        return {
          ...record._doc,
          employeeName: employee?.name,
          employeeId: record.employeeId,
          role: employee?.role || "employee",
          date: formatDate(record.date),
          status: record.status,
          working_hours: record.working_hours,
          daily_salary: employee?.wagePerHour * record.working_hours || 0,
        };
      })
    );

    return res.json({
      success: true,
      month: month,
      attendance: payroll || [],
    });
  } catch (err) {
    console.error("Error in getting attendence history with payroll:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch attendence history with payroll",
      message: err.message,
    });
  }
};

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
        error: "Invalid month - must be between 1 and 12",
      });
    }

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const attendanceHistory = await AttendenceHistory.find({
      userId: employeeId,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }).sort({ date: -1 }); // sort by date, newest first

    const payroll = await Promise.all(
      attendanceHistory.map(async (record) => {
        const employee = await User.findOne({ employeeId: record.employeeId });
        return {
          ...record._doc,
          employeeName: employee?.name,
          employeeId: record.employeeId,
          role: employee?.role || "employee",
          date: formatDate(record.date),
          status: record.status,
          working_hours: record.working_hours,
          daily_salary: employee?.wagePerHour * record.working_hours || 0,
        };
      })
    );
    console.log("payroll", payroll);
    return res.json({
      success: true,
      month: month,
      attendance: payroll || [],
    });
  } catch (err) {
    console.error("Error in getting attendence history with payroll:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch attendence history with payroll",
      message: err.message,
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
        (r) => r.userId.toString() === employee._id.toString()
      );

      return {
        userId: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        clockIn: record?.checkin_time || "Not clocked in",
        clockOut: record?.checkout_time || "Not clocked out",
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
    const { userId, date } = data;

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
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    // Don't process duplicate check-ins
    if (attendance && attendance.status === "in") {
      return {
        success: true,
        message: "Already checked in",
        attendance,
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
      message: "Check-in successful",
    };
  } catch (error) {
    console.error("Error during check-in:", error);
    return {
      success: false,
      message: "Check-in failed",
      error: error.message,
    };
  }
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
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (!attendance) {
      return {
        success: false,
        message: "No check-in record found for today",
      };
    }

    // Don't process duplicate check-outs
    if (attendance.status === "out") {
      return {
        success: false,
        message: "Already checked out",
      };
    }

    // Check if check-in exists
    if (!attendance.current_checkin_time) {
      return {
        success: false,
        message: "Must check in before checking out",
      };
    }

    const currentTime = new Date();

    const diffMs = currentTime - attendance.current_checkin_time;

    const secondsWorked = Math.floor(diffMs / 1000);

    const hoursWorked = parseFloat((secondsWorked / 3600).toFixed(2));

    attendance.checkout_time = currentTime;
    attendance.status = "out";
    attendance.working_hours += hoursWorked; // Stored in hours as decimal

    await attendance.save();

    return {
      success: true,
      data: {
        ...attendance._doc,
      },
      message: "Check-out successful",
    };
  } catch (error) {
    console.error("Socket check-out error:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};
