import bcrypt from "bcryptjs";
import admin from "../../firebaseAdmin.js";
import User from "../models/userModel.js";
import { joinOrCreateCircle } from "./cropCircleController.js"; // helper to join/create crop circle

// --------------------------
// Google Login
// --------------------------
export const googleLogin = async (req, res) => {
  try {
    const { idToken, gps_lat, gps_lng, crop_name } = req.body;
    if (!idToken) return res.status(400).json({ error: "idToken is required" });

    const decoded = await admin.auth().verifyIdToken(idToken);
    let user = await User.findOne({ uid: decoded.uid });

    if (!user) {
      // New user: save crop_name if provided
      user = await User.create({
        uid: decoded.uid,
        name: decoded.name,
        email: decoded.email,
        profile_photo: decoded.picture,
        googleLogin: true,
        gps_lat,
        gps_lng,
        crop_name: crop_name || null,
        experience_level: "beginner", // default
      });
    } else {
      // Update GPS/crop info if provided
      if (gps_lat) user.gps_lat = gps_lat;
      if (gps_lng) user.gps_lng = gps_lng;
      if (crop_name) user.crop_name = crop_name;
      await user.save();
    }

    // Auto join/create crop circle if user has crop_name & GPS
    if (user.crop_name && gps_lat && gps_lng) {
      await joinOrCreateCircleInternal(user._id, user.crop_name, gps_lat, gps_lng);
    }

    res.json({ message: "Login successful", user });
  } catch (err) {
    console.error("Firebase auth error:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
};

// --------------------------
// Email & Password Login
// --------------------------
export const emailLogin = async (req, res) => {
  try {
    const { email, password, gps_lat, gps_lng } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ error: "User not found. Please sign up." });
    if (user.googleLogin) return res.status(400).json({ error: "This account uses Google login. Please login with Google." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    // Update GPS if provided
    if (gps_lat) user.gps_lat = gps_lat;
    if (gps_lng) user.gps_lng = gps_lng;
    await user.save();

    // Auto join/create crop circle if user has crop_name & GPS
    if (user.crop_name && gps_lat && gps_lng) {
      await joinOrCreateCircleInternal(user._id, user.crop_name, gps_lat, gps_lng);
    }

    res.json({ message: "Login successful", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// --------------------------
// Manual Registration
// --------------------------
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, crop_name, gps_lat, gps_lng, experience_level } = req.body;
    if (!name || !email || !password || !crop_name) return res.status(400).json({ error: "All fields are required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      googleLogin: false,
      crop_name,
      gps_lat,
      gps_lng,
      experience_level: experience_level || "beginner",
    });

    // Auto join/create crop circle
    if (crop_name && gps_lat && gps_lng) {
      await joinOrCreateCircleInternal(user._id, crop_name, gps_lat, gps_lng);
    }

    res.json({ message: "User registered successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
