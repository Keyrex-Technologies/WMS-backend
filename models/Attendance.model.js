// models/Attendance.js

import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['in', 'out'],
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
});

const Attendence = mongoose.model("Attendence", attendanceSchema);
export default Attendence;
