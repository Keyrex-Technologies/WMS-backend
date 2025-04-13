import express from "express";
import cookieParser from "cookie-parser";
import 'dotenv/config';
import cors from "cors";
import globalErrorHandler from "./Errors/globalErrorHandler.js";

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());

// =========================== ALL Imports of Routes  ======================================
import { FirstRoute, UserRoute } from "./routes/index.routes.js";
import AttendanceRoutes from "./routes/attendance.routes.js";
import AdminRoutes from "./routes/adminRoutes.js";
import CustomError from "./Errors/customErrorHandler.js";
import { authenticateToken } from "./middleware/auth.js";
import connectDB from "./utils/db.js";
// import { EmployeeRoutes } from "./routes/"

// Connect to MongoDB before starting the server
connectDB().then(() => {
  console.log('Database connection established');
}).catch(err => {
  console.error('Database connection failed', err);
});

// Routes
app.use("/first", FirstRoute);
app.use("/user", UserRoute);
// app.use('/employees', authenticateToken, EmployeeRoutes); // Authenticated employee routes
app.use('/attendance', authenticateToken, AttendanceRoutes); // Authenticated attendance routes
app.use('/admin', authenticateToken, AdminRoutes); // Admin routes for role change
app.use("*", (req, res) => {
  throw new CustomError(`${req.url} not found`, 404);
});

// Error handler
app.use(globalErrorHandler);

// Start the server
app.listen(4000, () => {
  console.log("Server started on port 4000");
  console.log("Link: http://localhost:4000");
});
