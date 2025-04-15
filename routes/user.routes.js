// import {createUser} from "../controllers/users.js"
import { Router } from "express";
import { asyncErrorHandler } from "../Errors/AsyncErrorHandler.js";
import { UpdatePassword, forgotPassword, getProfile, resendOtpController, resetPassword, updateProfile, userSignInController, userSignUpController, verifyOTPresetPassword, verifyOtpController } from "../controllers/User.js";
import { authenticateUser } from "../middleware/auth.js";

const router = Router();
// router.post(
//   "/",
//   asyncErrorHandler(async (req, res) => {
//     // createUser(req,res)
//     res.status(201).json({ message: "User created successfully" });
//   })
// );



// Sign up
router.post("/signup", asyncErrorHandler(userSignUpController));

// Verify email with OTP
router.post("/verify-otp", asyncErrorHandler(verifyOtpController));

// Sign in
router.post("/signin", asyncErrorHandler(userSignInController));

// Forgot password
router.post("/forgot-password", asyncErrorHandler(forgotPassword));
router.post("/update-password", authenticateUser, asyncErrorHandler(UpdatePassword));

// Verify OTP for password reset
router.post("/verify-otp-reset", asyncErrorHandler(verifyOTPresetPassword));

// Reset password
router.post("/reset-password", asyncErrorHandler(resetPassword));

// Resend otp
router.post("/resend-otp", asyncErrorHandler(resendOtpController));

// Get user profile
router.get("/:userId", getProfile);

// Update profile
router.put("/update/:userId", updateProfile);

export default router;
