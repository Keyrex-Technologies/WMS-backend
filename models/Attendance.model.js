import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
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
        current_checkin_time: {
            type: Date,
            default: null
        },
        checkout_time: {
            type: Date,
            default: null
        },
        status: {
            type: String,
            enum: ["in", "out"],
            default: "out",
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

const AttendanceModel = mongoose.model("Attendance", attendanceSchema);

export default AttendanceModel;
