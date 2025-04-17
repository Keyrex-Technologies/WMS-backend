import User from "../models/users.model.js";
import validatePassword from "../utils/passwordValidators.js";
import { sendEmail, sendPasswordResetEmail } from "../utils/sendEmail.js";
import mongoose from "mongoose";

// signup
export async function userSignUpController(req, res) {
  try {
    const { email, password, phoneNumber, name, cnic, employeeId } = req.body;
    if (!email) {
      return res.status(400).json({
        message: "Please provide email",
        success: false,
      });
    }
    if (!password) {
      return res.status(400).json({
        message: "Please provide password",
        success: false,
      });
    }
    if (!phoneNumber) {
      return res.status(400).json({
        message: "Please provide phone number",
        success: false,
      });
    }
    if (!cnic) {
      return res.status(400).json({
        message: "Please provide cnic",
        success: false,
      });
    }
    if (!employeeId) {
      return res.status(400).json({
        message: "Please provide employee id",
        success: false,
      });
    }
    if (!name) {
      return res.status(400).json({
        message: "Please provide name",
        success: false,
      });
    }
    const isPasswordValid = validatePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be 8-15 characters long.",
        success: false,
      });
    }
    const existingUserVerifiedByEmail = await User.findOne({
      email,
      // isVerified: true,
    });

    if (existingUserVerifiedByEmail) {
      return res.status(400).json({
        message: "User already exist!",
        success: false,
      });
    }
    const existingUserByEmail = await User.findOne({ email });
    // Generate a 4-digit OTP
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    if (existingUserByEmail) {
      if (existingUserByEmail.isVerified) {
        return res.status(400).json({
          message: "User already exist!",
          success: false,
        });
      } else {
        existingUserByEmail.password = password;
        existingUserByEmail.verifyCode = generatedOtp;
        const expiryDate = new Date();
        existingUserByEmail.verifyCodeExpiry = expiryDate.setMinutes(
          expiryDate.getMinutes() + 15
        );
        await existingUserByEmail.save();
      }
    } else {
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1);
      const newUser = new User({
        name,
        email,
        cnic,
        password,
        employeeId,
        phoneNumber,
        verifyCode: generatedOtp,
        verifyCodeExpiry: expiryDate,
        isVerified: false,
      });
      await newUser.save();
    }
    //send verification email
    await sendEmail(email, generatedOtp, name);
    // const saveUser = await userData.save();
    res.status(201).json({
      success: true,
      message: "OTP: One Time password sent to this email, please verify",
      // otp: generatedOtp, // Optionally send the OTP back to the client
    });
  } catch (err) {
    console.log("err", err);
    res.json({
      message: err.message || err,
      success: false,
    });
  }
}

// verify
export async function verifyOtpController(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
        success: false,
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
    const isCodeValid = user.verifyCode === otp;
    const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date();
    if (isCodeValid && isCodeNotExpired) {
      await User.updateOne({ _id: user._id }, { isVerified: true });
      return res.status(200).json({
        success: true,

        message: "Email verified successfully",
      });
    } else if (!isCodeNotExpired) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired, resend code to verify.",
      });
    } else {
      return res.status(400).json({
        success: false,

        message: "Incorrect verification code.",
      });
    }
  } catch (err) {
    res.status(400).json({
      message: err.message || "An error occurred during OTP verification",
      success: false,
    });
  }
}

// login
export async function userSignInController(req, res) {
  const frontendHost = req.headers.origin;

  try {
    const { email, password } = req.body;

    console.log(req.body);
    if (!email) {
      return res.status(400).json({
        message: "Please provide email",
        success: false,
      });
    }
    if (!password) {
      return res.status(400).json({
        message: "Please provide password",
        success: false,
      });
    }

    const user = await User.findOne({ email });

    console.log("user", user);
    if (!user) {
      return res.status(404).json({
        message: "Invalid Credentials!",
        success: false,
      });
    }
    if (!user.isVerified) {
      return res.status(404).json({
        message: "User is not verified",
        success: false,
      });
    }
    if (!user?.password) {
      return res.status(400).json({
        message: "Invalid Credentials!",
        success: false,
      });
    }
    const isPasswordCorrect = await user.matchPassword(password);

    if (isPasswordCorrect) {
      // Hostname-based logic
      if (frontendHost === "https://www.xyz.com" && user.isAdmin) {
        return res.status(401).json({ message: "Invalid credentials." });
      }

      if (frontendHost === "https://admin.xyz.com" && !user.isAdmin) {
        return res.status(401).json({ message: "Invalid credentials." });
      }
      const token = await user.generateAccessToken();
      const userDataToSend = {
        _id: user._id,
        email: user.email,
        name: user.name,
        isApproved: user.isApproved,
        isVerified: user.isVerified,
        role: user.role,
      };
      const options = {
        httpOnly: true,
        secure: true,
      };
      res.status(200).cookie("token", token, options).json({
        message: "Login successfully",
        user: userDataToSend,
        token: token,
        success: true,
      });
    } else {
      return res.status(400).json({
        message: "Invalid Email or Password",
        success: false,
      });
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: err.message || "Internal server Error in login",
      success: false,
    });
  }
}

// forgot-pass
export async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email is required",
      success: false,
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Return generic message for security
      return res.status(200).json({
        success: true,
        message: "If this email exists, you'll receive a password reset OTP",
      });
    }

    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiryDate = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.verifyCode = generatedOtp;
    user.verifyCodeExpiry = expiryDate;
    await user.save();

    // console.log(email)

    // Send email
    await sendPasswordResetEmail(email, generatedOtp, user.name);

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

//resend otp
export async function resendOtpController(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Please provide email",
        success: false,
      });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "User is already verified",
        success: false,
      });
    }

    // Generate a new 4-digit OTP
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // Update user with new OTP and expiry
    user.verifyCode = generatedOtp;
    const expiryDate = new Date();
    user.verifyCodeExpiry = expiryDate.setMinutes(expiryDate.getMinutes() + 15);

    await user.save();

    // Send the new OTP via email
    await sendEmail(email, generatedOtp, user.name);

    res.status(200).json({
      success: true,
      message: "New OTP has been sent to your email",
    });
  } catch (err) {
    console.log("Error in resendOtpController:", err);
    res.status(500).json({
      message: err.message || "Internal server error",
      success: false,
    });
  }
}

//verify reset otp
export async function verifyOTPresetPassword(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
        success: false,
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
    const isCodeValid = user.verifyCode === otp;
    const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date();
    if (isCodeValid && isCodeNotExpired) {
      return res.status(200).json({
        success: true,

        message: "Email verified successfully",
      });
    } else if (!isCodeNotExpired) {
      return res.status(400).json({
        success: false,

        message: "Verification code has expired, resend code to verify.",
      });
    } else {
      return res.status(400).json({
        success: false,

        message: "Incorrect verification code.",
      });
    }
  } catch (error) {
    res.json({
      message: err.message || "Error in forgot password verify code",
      success: false,
    });
  }
}

//reset password
export async function resetPassword(req, res) {
  const { email, password } = req.body;
  try {
    if (!email) {
      return res.status(400).json({
        message: "Please provide email",
        success: false,
      });
    }
    if (!password) {
      return res.status(400).json({
        message: "Please provide password",
        success: false,
      });
    }
    const isPasswordValid = validatePassword(password);
    console.log(isPasswordValid);

    if (!isPasswordValid) {
      return res.status(400).json({
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be 8-15 characters long.",
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
    if (!user.isVerified) {
      return res.status(404).json({
        message: "User is not verified",
        success: false,
      });
    }
    user.password = password;
    await user.save();
    res.status(200).json({
      message: "Password reset successfully",
      success: true,
    });
  } catch (error) {
    res.json({
      message: err.message || "Error in reset password",
      success: false,
    });
  }
}

// update-employee
export async function updateUserController(req, res) {
  const updateData = req.body;
  const userId = new mongoose.Types.ObjectId(req.user._id);
  try {
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
    // Remove sensitive fields before sending the response
    const { password, expiryDate, verifytoken, ...userData } =
      updatedUser.toObject();
    const token = await updatedUser.generateAccessToken();
    const options = {
      httpOnly: true,
      secure: true,
    };
    res.status(200).cookie("token", token, options).json({
      message: "Updated successfully",
      user: userData,
      token: token,
      success: true,
    });
  } catch (error) {
    res.json({
      message: err.message || "Error while updating user",
      success: false,
    });
  }
}

// get profile
export const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
        field: "userId",
      });
    }

    const user = await User.findById(userId).select(
      "-password -verifyCode -verifyCodeExpiry -refreshToken"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with the provided ID",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("[User Profile Controller Error]", error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching user profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// update profile
export const updateProfile = async (req, res) => {
  try {
    const { name, phoneNumber, address, cnic, email, role } = req.body;
    const { userId } = req.params;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Check if user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prepare update data and remove undefined/null fields
    const updateData = { name, phoneNumber, address, cnic, email, role };
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] == null) {
        delete updateData[key];
      }
    });

    // Perform the update
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -verifyCode -verifyCodeExpiry -googleId");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate field value entered",
        field: Object.keys(error.keyPattern)[0],
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// logout
export function LogoutController(req, res) {
  try {
    res
      .clearCookie("token", {
        httpOnly: true,
        secure: true,
      })
      .status(200)
      .json({
        message: "Logout successful",
        success: true,
      });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Internal server error in logout",
      success: false,
    });
  }
}
