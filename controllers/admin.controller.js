import User from "../models/users.model.js";
import { sendAdminAddedEmployeeEmail } from "../utils/sendEmail.js";

// add employee
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
      employeeId,
      status,
    } = req.body;

    console.log(req.body);
    const requiredFields = {
      name: "Employee name",
      employeeId: "Employee ID",
      email: "Email address",
      password: "Password",
      cnic: "CNIC",
      wagePerHour: "Wage per hour",
      weeklyWorkingDays: "Weekly working days",
      phoneNumber: "Phone number",
      dailyWorkingHours: "Daily working hours",
      status: "status not provided",
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([field]) => !req.body[field])
      .map(([_, fieldName]) => fieldName);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Missing required fields",
        missingFields: missingFields,
        message: `The following fields are required: ${missingFields.join(
          ", "
        )}`,
      });
    }

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
      isApproved: true,
      isVerified: true,
      status,
    });

    const savedEmployee = await newEmployee.save();

    const emailContent = `
            <h1>Welcome to Our Team!</h1>
            <p>Your employee account has been created successfully.</p>
            <h3>Your Login Credentials:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p><strong>Employee ID:</strong> ${employeeId}</p>
            <p><strong>Role:</strong> ${role || "employee"}</p>
            <h3>Employee Details:</h3>
            <p><strong>Full Name:</strong> ${name}</p>
            <p><strong>Wage Per Hour:</strong> PKR ${wagePerHour}</p>
            <p><strong>Working Schedule:</strong> ${dailyWorkingHours} hours/day, ${weeklyWorkingDays} days/week</p>
            <p>Please change your password after first login.</p>
        `;

    await sendAdminAddedEmployeeEmail({
      to: email,
      subject: "Your Employee Account Credentials",
      html: emailContent,
    });

    const responseData = {
      _id: savedEmployee._id,
      name: savedEmployee.name,
      email: savedEmployee.email,
      role: savedEmployee.role,
      employeeId: savedEmployee.employeeId,
      joiningDate: savedEmployee.joiningDate,
      status: savedEmployee.status,
    };
    res.status(201).json({
      message: "Employee added and user registered successfully",
      employee: responseData,
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      res.status(400).json({ error: `${field} already exists` });
    } else if (err.name === "ValidationError") {
      console.error("Validation Error:", err);
      res.status(400).json({ error: err.message });
    } else {
      console.error("Server Error:", err);
      res.status(500).json({
        error: "Failed to add employee",
        details:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }
};

// update employee
export const updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const updates = req.body;

    if (!employeeId?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
        field: "employeeId",
      });
    }

    const employee = await User.findOne({ employeeId: employeeId.trim() });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found with the provided ID",
      });
    }

    if (
      req.user.role !== "admin" &&
      req.user.employeeId !== employee.employeeId
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this employee's profile",
      });
    }

    const restrictedFields = [
      "password",
      "email",
      "employeeId",
      "verifyCode",
      "verifyCodeExpiry",
      "googleId",
      "role",
    ];

    restrictedFields.forEach((field) => delete updates[field]);

    if (req.user.role !== "admin") {
      const protectedFields = ["role", "status", "wagePerHour"];
      const attemptedProtectedUpdate = protectedFields.some(
        (field) => field in updates
      );

      if (attemptedProtectedUpdate) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update restricted fields",
        });
      }
    }

    const updatedEmployee = await User.findOneAndUpdate(
      { employeeId: employeeId.trim() },
      {
        $set: {
          ...updates,
          isApproved: true,
        },
      },
      {
        new: true,
        runValidators: true,
        context: "query",
      }
    ).select("-password -verifyCode -verifyCodeExpiry -googleId -__v");

    if (!updatedEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found after update attempt",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: {
        employee: updatedEmployee,
      },
    });
  } catch (error) {
    console.error("[Employee Update Error]", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate field value",
        field: Object.keys(error.keyPattern)[0],
      });
    }

    return res.status(500).json({
      success: false,
      message: "An error occurred while updating employee",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

//delete employee
export const deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    await User.findByIdAndUpdate(employeeId, {
      isActive: false,
      deletedAt: new Date(),
    });

    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete employee" });
  }
};

//get individual employee
export const getEmployeeById = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await User.findOne({ employeeId: employeeId }).select(
      "name email cnic role address status wagePerHour employeeId dailyWorkingHours phoneNumber weeklyWorkingDays"
    );

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    return res.status(200).json(employee);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch employee" });
  }
};

// get all employees
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find()
      .select("name email role status wagePerHour employeeId")
      .sort({ createdAt: -1 });

    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
};

// Update user role
// export const updateUserRole = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { role } = req.body;

//     // Validate role
//     if (!["employee", "manager", "admin"].includes(role)) {
//       return res.status(400).json({ error: "Invalid role" });
//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { role },
//       { new: true }
//     );

//     if (!updatedUser) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     res.json(updatedUser);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// Update hourly rate
// export const updateHourlyRate = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { hourlyRate } = req.body;

//     if (hourlyRate <= 0) {
//       return res.status(400).json({ error: "Hourly rate must be positive" });
//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { hourlyRate },
//       { new: true }
//     );

//     if (!updatedUser) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     res.json(updatedUser);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// employee status
// export const getEmployeeStatus = async (req, res) => {
//   try {
//     const { employeeId } = req.params;

//     // Find employee and only return the status fields
//     const employee = await User.findById(employeeId).select(
//       "isApproved isActive employeeId name email"
//     );

//     if (!employee) {
//       return res.status(404).json({ error: "Employee not found" });
//     }

//     res.json({
//       employeeId: employee.employeeId,
//       name: employee.name,
//       email: employee.email,
//       isApproved: employee.isApproved || false,
//       isActive: employee.isActive !== false, // Default to true if undefined
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch employee status" });
//   }
// };
