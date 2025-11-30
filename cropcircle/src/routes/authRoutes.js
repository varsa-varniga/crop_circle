// routes/authRoutes.js
import express from "express";
import { syncGoogleUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/sync-google-user", syncGoogleUser);

export default router;
