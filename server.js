import express from "express";
import cookieParser from "cookie-parser";
import "dotenv/config";
import cors from "cors";
import globalErrorHandler from "./Errors/globalErrorHandler.js";
import http from "http";
import { Server } from "socket.io";
import UserRoute from "./routes/users.routes.js";
import AttendanceRoutes from "./routes/attendance.routes.js";
import AdminRoutes from "./routes/admin.routes.js";
import OriginsRoutes from "./routes/officeorigins.routes.js";
import { ensureOfficeOriginExists } from "./models/officeorigins.model.js";
import CustomError from "./Errors/customErrorHandler.js";
import { authenticateToken } from "./middleware/auth.js";
import connectDB from "./utils/db.js";
import { initAttendanceArchiving } from "./services/cronService.js";
import {
  socketCheckIn,
  socketCheckOut,
} from "./controllers/attendanceController.js";

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());

connectDB()
  .then(() => {
    console.log("Database connection established");
    initAttendanceArchiving();
    ensureOfficeOriginExists()
  })
  .catch((err) => {
    console.error("Database connection failed", err);
  });

// =================================== Sockets Work ======================================
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  
  socket.on("check-in", async (data) => {
    try {
      console.log(data);
      const token = socket.handshake.auth.token;
      if (!token) {
        throw new Error("Authentication required");
      }
      const user = { id: data.employeeId, date: data.date };
      const result = await socketCheckIn(data);
      if (result.success) {
        socket.emit("check-in-success", {
          message: "Checked in successfully",
          result,
          time: new Date(),
        });
      } else {
        socket.emit("check-in-error", { error: result.message });
      }
    } catch (error) {
      socket.emit("check-in-error", { error: error.message });
    }
  });

  socket.on("check-out", async (data) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        throw new Error("Authentication required");
      }

      const user = { id: data.employeeId, date: data.date };

      const result = await socketCheckOut(data);
      console.log(result);

      if (result.success) {
        socket.emit("check-out-success", {
          message: "Checked out successfully",
          time: new Date(),
          result,
        });

        io.emit("attendance-update", {
          type: "check-out",
          user,
          time: new Date(),
        });
      } else {
        socket.emit("check-out-error", { error: result.message });
      }
    } catch (error) {
      socket.emit("check-out-error", { error: error.message });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    console.log(socket);
  });
});

app.set("io", io);

// =====================================================================================

// Routes
app.use("/user", UserRoute);
app.use("/attendance", authenticateToken, AttendanceRoutes);
app.use("/admin", authenticateToken, AdminRoutes);
app.use("/origins", authenticateToken, OriginsRoutes);

app.use("*", (req, res) => {
  throw new CustomError(`${req.url} not found`, 404);
});

app.use(globalErrorHandler);

// Start the server
server.listen(5000, '0.0.0.0',() => {
  console.log("Server started on port 5000");
  console.log("Link: http://localhost:5000");
});
