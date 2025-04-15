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
        status: {
            type: String,
            required: true,
            enum: ["present", "late", "absent"],
        },
        role: { type: String },
        date: { type: String },

        email: {
            type: String,
            required: true,
            // match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
        },
        checkin_time: {
            type: Date,
            default: null
        },
        checkout_time: {
            type: Date,
            default: null
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
