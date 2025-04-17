import express from "express";
import {
  getOrigins,
  setOrigins,
} from "../controllers/officeorigins.controller.js";

const router = express.Router();
//  get origins
router.get("/get-origins", getOrigins);

// set origins
router.put("/set-origins", setOrigins);

export default router;
