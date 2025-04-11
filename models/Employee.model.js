// // models/Employee.js
// import mongoose from 'mongoose';

// const employeeSchema = new mongoose.Schema({
//     name: String,
//     employeeId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Employee',
//     },
//     role: { type: String, enum: ['admin', 'manager', 'employee'], default: 'employee' },
//     hourlyRate: Number,
//     createdAt: { type: Date, default: Date.now }
// });

// const Employee = mongoose.model("Employees", employeeSchema);
// export default Employee;

// models/Employee.js
// models/Employee.js
import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    cnic: {
        type: String,
        required: true,
        unique: true,
        // match: /^\d{5}-\d{7}-\d{1}$/
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    phoneNumber: {
        type: String,
        required: true,
        match: /^03\d{9}$/
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'chef', 'waiter', 'cashier'],
        default: 'waiter'
    },
    shift: {
        start: { type: String, match: /^([01]\d|2[0-3]):([0-5]\d)$/ }, // HH:MM format
        end: { type: String, match: /^([01]\d|2[0-3]):([0-5]\d)$/ }
    },
    wagePerHour: {
        type: Number,
        required: true,
        min: 0
    },
    weeklyWorkingDays: {
        type: Number,
        required: true,
        min: 1,
        max: 7
    },
    employmentType: {
        type: String,
        enum: ['full-time', 'part-time', 'contract'],
        default: 'full-time'
    },
    isActive: { type: Boolean, default: true },
    lastAttendance: { type: Date },
    currentStatus: {
        type: String,
        enum: ['working', 'on-break', 'checked-out', 'on-leave'],
        default: 'checked-out'
    },
    employeeId: {
        type: String,
        unique: true
    },
    dailyWorkingHours: {
        type: Number,
        required: true,
        min: 1,
        max: 24
    }, address: {
        type: String
    },
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;