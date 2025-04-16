import mongoose from "mongoose";

const attendanceHistorySchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        employeeId: { type: String, required: true },
        employeeName: { type: String, required: true },
        email: {
            type: String,
            required: true,
        },
        date: { type: Date, required: true },
        checkin_time: {
            type: Date,
            default: null
        },
        checkout_time: {
            type: Date,
            default: null
        },
        status: {
            type: String,
            enum: ["Present", "Absent", "Leave"],
            default: "Absent",
        },
        working_hours: {
            type: Number,
            min: 0,
            max: 24,
            default: 0
        },
    },
    { timestamps: true }
);

const AttendenceHistory = mongoose.model("AttendanceHistory", attendanceHistorySchema);

export default AttendenceHistory;