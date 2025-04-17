import { Router } from "express";
import {
  getTodayAttendance,
  getAttendanceStats,
  getEmployeeAttendance,
  getAllAttendance,
  getAllEmployeeAttendencePayroll,
  getAllEmployeesAttendencePayroll,
} from "../controllers/attendanceController.js";

const router = Router();

// Socket.IO enabled routes
router.post("/socket-check-in", async (req, res) => {
  try {
    const result = await socketCheckIn(req);

    // Emit to all connected clients
    getIO().emit("attendance-update", {
      type: "check-in",
      user: req.user,
      data: result,
      time: new Date(),
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/socket-check-out", async (req, res) => {
  try {
    const result = await socketCheckOut(req);

    getIO().emit("attendance-update", {
      type: "check-out",
      user: req.user,
      data: result,
      time: new Date(),
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


router.get("/get-daily-attendance", getTodayAttendance);

router.get("/stats", getAttendanceStats);

router.get("/get-all-attendance", getAllAttendance);

router.get("/get-all-payrolls", getAllEmployeesAttendencePayroll);

router.get("/get-payroll", getAllEmployeeAttendencePayroll);

export default router;
