// models/Attendance.js

import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['check-in', 'check-out'],
        required: true,
    },
    status: {
        type: String,
        emun: ['present', 'late', 'half-day', 'on-leave', 'Absent']
    },
    // overtime hours
    // overtime salary
    // total hours
    hours: {
        type: Number
    },
    totalSalary: {
        type: Number
    },
    // total salary
    timestamp: {
        type: Date,
        default: Date.now,
    }
});

const Attendence = mongoose.model("Attendence", attendanceSchema);
export default Attendence;
