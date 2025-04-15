// // models/Attendance.js

// import mongoose from 'mongoose';
// import { Schema } from 'mongoose';
// const attendanceSchema = new mongoose.Schema({
//     employeeId: {
//         type: String,
//         required: true,
//     },
//     type: {
//         type: String,
//         enum: ['check-in', 'check-out'],
//         required: true,
//     },
//     status: {
//         type: String,
//         emun: ['present', 'late', 'half-day', 'on-leave', 'Absent']
//     },
//     timestamp: {
//         type: Date,
//         required: true,
//         default: Date.now,
//         index: true
//     },
//     // overtime hours
//     // overtime salary
//     // total hours
//     // hours: {
//     //     type: Number
//     // },
//     // totalSalary: {
//     //     type: Number
//     // },
//     // total salary
//     // timestamp: {
//     //     type: Date,
//     //     default: Date.now,
//     // }
//     recordedBy: {
//         type: Schema.Types.ObjectId,
//         ref: 'User'
//     },
// }, {
//     timestamps: true // Adds createdAt and updatedAt automatically
// });

// const Attendence = mongoose.model("Attendence", attendanceSchema);
// export default Attendence;

import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
    {
        employeeId: { type: String, required: true },
        employeeName: { type: String, required: true },
        type: {
            type: String,
            required: true,
            enum: ["check-in", "check-out", "break-start", "break-end"],
        },
        status: {
            type: String,
            required: true,
            enum: ["present", "late", "half-day", "on-leave"],
        },
        role: { type: String }, // From employee
        department: { type: String }, // From employee
        date: { type: String }, // Formatted date string
        time: { type: String }, // Formatted time string
        timestamp: { type: Date, required: true }, // Actual timestamp
    },
    { timestamps: true }
);

const AttendanceModel = mongoose.model("Attendance", attendanceSchema);

export default AttendanceModel;
