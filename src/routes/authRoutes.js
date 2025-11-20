import express from "express";
import { googleLogin, emailLogin, registerUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/login-google", googleLogin);  // Only Google accounts
router.post("/login", emailLogin);         // Only manual accounts
router.post("/register", registerUser);    // Manual signup

export default router;
