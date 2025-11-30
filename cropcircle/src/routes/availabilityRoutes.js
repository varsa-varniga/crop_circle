import express from "express";
import {
  getAvailability,
  updateAvailability,
  bulkUpdateAvailability,
  deleteAvailability,
  getAvailabilitySummary
} from "../controllers/availabilityController.js";

const router = express.Router();

// Public routes
router.get("/:userId", getAvailability);
router.get("/:userId/summary", getAvailabilitySummary);
router.put("/:userId", updateAvailability);
router.post("/:userId/bulk", bulkUpdateAvailability);
router.delete("/:userId/:date", deleteAvailability);

export default router;