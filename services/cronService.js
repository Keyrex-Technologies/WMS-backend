import cron from "node-cron";
import AttendanceModel from "../models/Attendance.model.js";
import AttendanceHistoryModel from "../models/AttendenceHistory.model.js";

// Maps attendance status to attendance history status
const mapStatus = (status) => {
  if (status === "in") return "Present";
  if (status === "out") return "Present";
  return "Absent";
};

// Archive attendance records to history collection
export const archiveAttendanceRecords = async () => {
  try {
    console.log("Running attendance archiving job...");

    // Get yesterday's date range (for records that should be archived)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    // Find all attendance records for yesterday
    const attendanceRecords = await AttendanceModel.find({
      date: {
        $gte: yesterday,
        $lte: endOfYesterday,
      },
    });

    console.log(
      `Found ${attendanceRecords.length} attendance records to archive`
    );

    // Process each record and save to history
    const archivePromises = attendanceRecords.map(async (record) => {
      // Create a new history record
      const historyRecord = new AttendanceHistoryModel({
        userId: record.userId,
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        email: record.email,
        date: record.date,
        checkin_time: record.checkin_time,
        checkout_time: record.checkout_time,
        status: mapStatus(record.status),
        working_hours: record.working_hours,
      });

      return historyRecord.save();
    });

    // Wait for all records to be saved to history
    await Promise.all(archivePromises);

    console.log(
      `Successfully archived ${attendanceRecords.length} attendance records`
    );

    // Remove archived records from the active collection
    // Uncomment if you want to clear the attendance collection after archiving
    await AttendanceModel.deleteMany({
      date: {
        $gte: yesterday,
        $lte: endOfYesterday,
      },
    });

    return {
      success: true,
      message: `Archived ${attendanceRecords.length} attendance records to history collection`,
      count: attendanceRecords.length,
    };
  } catch (error) {
    console.error("Error archiving attendance records:", error);
    return {
      success: false,
      message: "Failed to archive attendance records",
      error: error.message,
    };
  }
};

// Schedule the task to run at midnight every day
export const initAttendanceArchiving = () => {
  // Cron format: second(optional) minute hour day-of-month month day-of-week
  // '0 0 * * *' = Run at midnight every day
  cron.schedule("0 0 * * *", async () => {
    console.log("Starting scheduled attendance archiving job");
    await archiveAttendanceRecords();
  });

  console.log("Attendance archiving job scheduled to run midnight");
};
