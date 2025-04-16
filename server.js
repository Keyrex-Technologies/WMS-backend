import express from "express";
import cookieParser from "cookie-parser";
import 'dotenv/config';
import cors from "cors";
import globalErrorHandler from "./Errors/globalErrorHandler.js";
import http from 'http'; // Add this import
import { Server } from 'socket.io';
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());

// =========================== ALL Imports of Routes  ======================================
import UserRoute from "./routes/users.routes.js";
import AttendanceRoutes from "./routes/attendance.routes.js";
import AdminRoutes from "./routes/admin.routes.js";
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


// =================================== Sockets Work ======================================



// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle check-in events
  socket.on('check-in', async (data) => {
    try {
      // Verify authentication
      const token = socket.handshake.auth.token;
      if (!token) {
        throw new Error('Authentication required');
      }

      // Here you would verify the token and get user data
      // This is a simplified example - implement proper authentication
      const user = { id: data.employeeId, email: data.email }; // Replace with actual auth

      // Emit check-in success
      socket.emit('check-in-success', {
        message: 'Checked in successfully',
        time: new Date()
      });

      // Notify admin dashboard
      io.emit('attendance-update', {
        type: 'check-in',
        user,
        time: new Date()
      });

    } catch (error) {
      socket.emit('check-in-error', { error: error.message });
    }
  });

  // Handle check-out events
  socket.on('check-out', async (data) => {
    try {
      // Similar authentication check as above
      const user = { id: data.employeeId, email: data.email };

      socket.emit('check-out-success', {
        message: 'Checked out successfully',
        time: new Date()
      });

      io.emit('attendance-update', {
        type: 'check-out',
        user,
        time: new Date()
      });

    } catch (error) {
      socket.emit('check-out-error', { error: error.message });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);



// =====================================================================================

// Routes
app.use("/user", UserRoute);
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
