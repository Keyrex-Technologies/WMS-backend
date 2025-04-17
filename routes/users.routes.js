import { Router } from "express";
import { asyncErrorHandler } from "../Errors/AsyncErrorHandler.js";
import {
  userSignUpController,
  verifyOtpController,
  userSignInController,
  forgotPassword,
  verifyOTPresetPassword,
  resetPassword,
  resendOtpController,
  getProfile,
  updateProfile,
  LogoutController,
} from "../controllers/users.controller.js";

const router = Router();

// Sign up
router.post("/signup", asyncErrorHandler(userSignUpController));

// Verify email with OTP
router.post("/verify-otp", asyncErrorHandler(verifyOtpController));

// Sign in
router.post("/signin", asyncErrorHandler(userSignInController));

// Forgot password
router.post("/forgot-password", asyncErrorHandler(forgotPassword));

// Verify OTP for password reset
router.post("/verify-otp-reset", asyncErrorHandler(verifyOTPresetPassword));

// Reset password
router.post("/reset-password", asyncErrorHandler(resetPassword));

// Resend OTP
router.post("/resend-otp", asyncErrorHandler(resendOtpController));

// Get user profile
router.get("/get-profile/:userId", getProfile);

// Update user profile
router.put("/update-profile/:userId", updateProfile);

// logout
router.get("/logout", LogoutController);

export default router;
