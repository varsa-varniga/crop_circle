// controllers/userController.js
import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// --------------------------
// Multer setup for profile photo
// --------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/profile_photos";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, req.params.user_id + "-" + Date.now() + ext);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};

export const uploadProfilePhoto = multer({ storage, fileFilter });

// --------------------------
// Register new user
// --------------------------
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, experience_level, date_of_birth ,} = req.body;
    const user = new User({
  name,
  email,
  password,
  experience_level,
  date_of_birth,
  isMentor: experience_level === "expert" // compute mentor status here
});

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    
    await user.save();

    res.status(201).json({
      message: "✅ User registered successfully",
      user,
    });
  } catch (error) {
    console.error("❌ Error registering user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// --------------------------
// Get user profile + all posts
// --------------------------
export const getUserProfile = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Include all fields except password
    const user = await User.findById(user_id).select("-password"); 
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch all posts by user
    const posts = await Post.find({ user_id })
      .populate("circle_id", "crop_name district")
      .sort({ created_at: -1 });

    // Now user.isMentor is automatically available
    res.status(200).json({ user, posts });
  } catch (error) {
    console.error("❌ Error fetching profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// --------------------------
// Update profile photo, bio, date of birth
// --------------------------



// userController.js
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.user_id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      user.profile_photo = `${baseUrl}/uploads/profile_photos/${req.file.filename}`;
    }

    if (req.body.bio?.trim()) user.bio = req.body.bio.trim();
    if (req.body.date_of_birth) user.date_of_birth = req.body.date_of_birth;

    if (req.body.experience_level) {
      user.experience_level = req.body.experience_level;
      // Update mentor badge dynamically
      user.isMentor = req.body.experience_level === "expert";
    }

    const updatedUser = await user.save();
    res.status(200).json({ user: updatedUser });
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};
