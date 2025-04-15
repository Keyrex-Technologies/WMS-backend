// controllers/adminController.js
// import Employee from '../models/Employee.model.js';
import User from '../models/User.js';
import { sendAdminAddedEmployeeEmail } from '../utils/sendEmail.js';


// Add a new employee
export const addEmployee = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            cnic,
            role,
            wagePerHour,
            weeklyWorkingDays,
            joiningDate,
            address,
            phoneNumber,
            dailyWorkingHours,
            // shift,
            employeeId,
            status
        } = req.body;

        console.log(req.body)
        // Validate required fields
        const requiredFields = {
            name: 'Employee name',
            employeeId: 'Employee ID',
            email: 'Email address',
            password: 'Password',
            cnic: 'CNIC',
            wagePerHour: 'Wage per hour',
            weeklyWorkingDays: 'Weekly working days',
            phoneNumber: 'Phone number',
            dailyWorkingHours: 'Daily working hours',
            status: "status not provided"
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([field]) => !req.body[field])
            .map(([_, fieldName]) => fieldName);

        if (missingFields.length > 0) {
            return res.status(400).json({
                error: 'Missing required fields',
                missingFields: missingFields,
                message: `The following fields are required: ${missingFields.join(', ')}`
            });
        }

        // Create employee first
        const newEmployee = new User({
            name,
            employeeId,
            cnic,
            password,
            email,
            phoneNumber,
            wagePerHour: Number(wagePerHour),
            weeklyWorkingDays: Number(weeklyWorkingDays),
            joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
            address,
            dailyWorkingHours: Number(dailyWorkingHours),
            // shift,
            // monthlySalary,
            // employmentType,
            isVerified: true,
            status
        });

        const savedEmployee = await newEmployee.save();

        // Create user with employee reference
        // const newUser = new User({
        //     name,
        //     email,
        //     password,
        //     cnic,
        //     role: role || 'waiter',
        //     employee: savedEmployee._id,
        //     isVerified: true // Automatically verify employee accounts
        // });

        // const savedUser = await newUser.save();

        // Send welcome email with credentials
        const emailContent = `
            <h1>Welcome to Our Team!</h1>
            <p>Your employee account has been created successfully.</p>
            <h3>Your Login Credentials:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p><strong>Employee ID:</strong> ${employeeId}</p>
            <p><strong>Role:</strong> ${role || 'waiter'}</p>
            <h3>Employee Details:</h3>
            <p><strong>Full Name:</strong> ${name}</p>
            <p><strong>Wage Per Hour:</strong> PKR ${wagePerHour}</p>
            <p><strong>Working Schedule:</strong> ${dailyWorkingHours} hours/day, ${weeklyWorkingDays} days/week</p>
            ${shift ? `<p><strong>Shift:</strong> ${shift.start} to ${shift.end}</p>` : ''}
            <p>Please change your password after first login.</p>
        `;

        await sendAdminAddedEmployeeEmail({
            to: email,
            subject: 'Your Employee Account Credentials',
            html: emailContent
        });

        // Prepare response data (excluding sensitive fields)
        const responseData = {
            _id: savedEmployee._id,
            name: savedEmployee.name,
            email: savedEmployee.email,
            role: savedEmployee.role,
            employeeId: savedEmployee.employeeId,
            // fullName: savedEmployee.fullName,
            joiningDate: savedEmployee.joiningDate,
            status: savedEmployee.status
        };
        res.status(201).json({
            message: 'Employee added and user registered successfully',
            employee: responseData
        });

    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            res.status(400).json({ error: `${field} already exists` });
        } else if (err.name === 'ValidationError') {
            console.error('Validation Error:', err);
            res.status(400).json({ error: err.message });
        } else {
            console.error('Server Error:', err);
            res.status(500).json({
                error: 'Failed to add employee',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }
};

// Update user role
export const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        // Validate role
        if (!['employee', 'manager', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update hourly rate
export const updateHourlyRate = async (req, res) => {
    try {
        const { userId } = req.params;
        const { hourlyRate } = req.body;

        if (hourlyRate <= 0) {
            return res.status(400).json({ error: 'Hourly rate must be positive' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { hourlyRate },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

//get all employees
// export const getAllEmployees = async (req, res) => {
//     try {
//         // Get all employees from the database
//         const employees = await Employee.find({})
//             .sort({ joiningDate: -1 }) // Sort by joining date (newest first)
//             .select('-__v'); // Exclude the version key field

//         res.json(employees);
//     } catch (err) {
//         console.error('Error fetching employees:', err);
//         res.status(500).json({
//             error: 'Failed to fetch employees',
//             details: err.message
//         });
//     }
// };

//uodate employee data
export const updateEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const updates = req.body;

        // Remove sensitive fields that shouldn't be updated
        delete updates.password;
        delete updates.email;
        delete updates.employeeId;

        // Validate if employee exists
        const employee = await User.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        // Update employee
        const updatedEmployee = await User.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            message: 'Employee updated successfully',
            employee: updatedEmployee
        });
    } catch (err) {
        if (err.name === 'ValidationError') {
            res.status(400).json({ error: err.message });
        } else {
            console.error(err);
            res.status(500).json({ error: 'Failed to update employee' });
        }
    }
};

//delete employee
export const deleteEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;

        // Check if employee exists
        const employee = await User.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        // Soft delete (recommended)
        await User.findByIdAndUpdate(employeeId, { isActive: false, deletedAt: new Date() });

        // Or hard delete
        // await User.findByIdAndDelete(id);

        res.json({ message: 'Employee deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
};

// employee status
export const getEmployeeStatus = async (req, res) => {
    try {
        const { employeeId } = req.params;

        // Find employee and only return the status fields
        const employee = await User.findById(employeeId)
            .select('isApproved isActive employeeId name email');

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json({
            employeeId: employee.employeeId,
            name: employee.name,
            email: employee.email,
            isApproved: employee.isApproved || false,
            isActive: employee.isActive !== false // Default to true if undefined
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch employee status' });
    }
};

// Get all employee

export const getAllEmployees = async (req, res) => {
    try {
        // Find all users with employee role (adjust the query as needed)
        const employees = await User.find({ role: 'employee' })
            .select('name email role status currentStatus employeeId')
            .sort({ createdAt: -1 });

        res.json(employees);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
};


