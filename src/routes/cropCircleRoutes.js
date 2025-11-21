import express from "express";
import { joinOrCreateCircle, assignMentor,  getMyCircle } from "../controllers/cropCircleController.js";

const router = express.Router();

// Route: Join or create a crop circle
// ✅ Expects body: { user_id, crop_name, district }
router.post("/join-or-create", joinOrCreateCircle);

// Route: Assign a mentor manually (for testing)
// Expects body: { circle_id, user_id }
router.post("/assign-mentor", assignMentor);
router.get("/my-circle", getMyCircle);
router.get("/get-my-circle", getMyCircle);
export default router;
