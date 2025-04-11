// controllers/adminController.js
import Employee from '../models/Employee.model.js';
import User from '../models/User.js';


// Add a new employee
export const addEmployee = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            cnic,
            role,
            fullName,
            wagePerHour,
            weeklyWorkingDays,
            joiningDate,
            address,
            phoneNumber,
            dailyWorkingHours,
            shift,
            employmentType,
            employeeId
        } = req.body;

        // Validate required fields
        if (!name || !employeeId || !email || !password || !cnic || !fullName ||
            !wagePerHour || !weeklyWorkingDays || !phoneNumber || !dailyWorkingHours) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create employee first
        const newEmployee = new Employee({
            fullName,
            employeeId,
            cnic,
            email,
            phoneNumber,
            wagePerHour: Number(wagePerHour),
            weeklyWorkingDays: Number(weeklyWorkingDays),
            joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
            address,
            dailyWorkingHours: Number(dailyWorkingHours),
            shift,
            employmentType
        });

        const savedEmployee = await newEmployee.save();

        // Then create user with employee reference
        const newUser = new User({
            name,
            email,
            password,
            cnic,
            role: role || 'waiter',
            employee: savedEmployee._id
        });

        const savedUser = await newUser.save();

        res.status(201).json({
            user: {
                _id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email,
                role: savedUser.role
            },
            employee: {
                _id: savedEmployee._id,
                fullName: savedEmployee.fullName
            }
        });

    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            res.status(400).json({ error: `${field} already exists` });
        } else if (err.name === 'ValidationError') {
            console.error('Error adding employee:', err);
            res.status(400).json({ error: err.message });
        } else {
            console.error('Error adding employee:', err);
            res.status(500).json({ error: 'Server error', details: err.message });
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
export const getAllEmployees = async (req, res) => {
    try {
        // Get all employees from the database
        const employees = await Employee.find({})
            .sort({ joiningDate: -1 }) // Sort by joining date (newest first)
            .select('-__v'); // Exclude the version key field

        res.json(employees);
    } catch (err) {
        console.error('Error fetching employees:', err);
        res.status(500).json({
            error: 'Failed to fetch employees',
            details: err.message
        });
    }
};