import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Employee from "./Employee.model.js";

const userSchema = new mongoose.Schema(

  {
    // Authentication and Basic Info
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please use a valid email address",
      ],
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'employee'],
      default: 'employee'
    },

    // Employee Information

    cnic: {
      type: String,
      required: function () { return this.role !== 'admin'; },
      unique: true,
    },
    wagePerHour: {
      type: Number,
      min: 0
    },
    weeklyWorkingDays: {
      type: Number,
      min: 1,
      max: 7
    },
    joiningDate: {
      type: Date,
      default: Date.now
    },
    address: {
      type: String
    },
    phoneNumber: {
      type: String,
      required: function () { return this.role !== 'admin'; },
    },
    dailyWorkingHours: {
      type: Number,
      min: 1,
      max: 24
    },

    isActive: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive'
    },
    employeeId: {
      type: String,
      unique: true
    },
    verifyCode: {
      type: String,
    },
    verifyCodeExpiry: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Social Login
    googleId: {
      type: String,
      default: "",
    },

    // Profile
    profile: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      }
    }
  },
  { timestamps: true }
);
// Encrypt password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate AccessToken
userSchema.methods.generateAccessToken = async function () {
  const token = await jwt.sign(
    {
      _id: this._id,
      isVerified: this.isVerified,
      name: this.name,
      email: this.email,
      role: this.role,
      profile: this.profile,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: 60 * 60 * 24,
    }
  );
  return token;
};
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
