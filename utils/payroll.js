import Employee from "../models/Employee.model.js";


function getHoursDifference(inTime, outTime) {
    return (new Date(outTime) - (new Date(inTime))) / (1000 * 60 * 60);
}

export const calculatePayroll = async (employeeId) => {
    const employee = await Employee.findOne({ employeeId });
    if (!employee) return {};

    const allRecords = await Attendance.find({ employeeId }).sort({ timestamp: 1 });

    const workLogs = [];
    for (let i = 0; i < allRecords.length - 1; i += 2) {
        const inRecord = allRecords[i];
        const outRecord = allRecords[i + 1];

        if (inRecord.type === 'in' && outRecord.type === 'out') {
            const hours = getHoursDifference(inRecord.timestamp, outRecord.timestamp);
            workLogs.push({
                date: inRecord.timestamp.toISOString().slice(0, 10),
                hours,
                amount: hours * employee.hourlyRate,
            });
        }
    }

    const today = new Date().toISOString().slice(0, 10);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStartStr = weekStart.toISOString().slice(0, 10);
    const month = new Date().toISOString().slice(0, 7);

    const daily = workLogs
        .filter(w => w.date === today)
        .reduce((sum, w) => sum + w.amount, 0);

    const weekly = workLogs
        .filter(w => w.date >= weekStartStr)
        .reduce((sum, w) => sum + w.amount, 0);

    const monthly = workLogs
        .filter(w => w.date.startsWith(month))
        .reduce((sum, w) => sum + w.amount, 0);

    return { daily, weekly, monthly };
};