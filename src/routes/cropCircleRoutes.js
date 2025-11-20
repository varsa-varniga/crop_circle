import express from "express";
import { joinOrCreateCircle, assignMentor } from "../controllers/cropCircleController.js";

const router = express.Router();

// Route: Join or create a crop circle
router.post("/join-or-create", joinOrCreateCircle);

// Route: Assign a mentor manually (for testing)
router.post("/assign-mentor", assignMentor);

export default router;
