import bcrypt from "bcryptjs";
import admin from "../../firebaseAdmin.js";
import User from "../models/userModel.js";

// --------------------------
// Google Login
// --------------------------
export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken)
      return res.status(400).json({ error: "idToken is required" });

    const decoded = await admin.auth().verifyIdToken(idToken);
    let user = await User.findOne({ uid: decoded.uid });

    if (!user) {
      user = await User.create({
        uid: decoded.uid,
        name: decoded.name,
        email: decoded.email,
        profile_photo: decoded.picture,
        googleLogin: true,
      });
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
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const user = await User.findOne({ email });

    // User not found at all
    if (!user) return res.status(404).json({ error: "User not found. Please sign up." });

    // User exists but is a Google account
    if (user.googleLogin)
      return res.status(400).json({ error: "This account uses Google login. Please login with Google." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

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
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields are required" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ error: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      googleLogin: false,
    });

    res.json({ message: "User registered successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
