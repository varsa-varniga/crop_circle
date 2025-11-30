import express from "express";
import { googleLogin, emailLogin, registerUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", emailLogin);
router.post("/login-google", googleLogin);
router.post("/register", registerUser);

export default router;
