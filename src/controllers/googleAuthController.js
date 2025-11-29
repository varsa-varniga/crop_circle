import admin from "../firebaseAdmin.js";
import User from "../models/userModel.js";

export const syncGoogleUser = async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split(" ")[1];
    if (!idToken) return res.status(401).json({ message: "Missing token" });

    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decoded;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        uid,
        email,
        name,
        googleLogin: true,
        profile_photo: picture || "",
        experience_level: "beginner",
        isMentor: false,
        joined_circles: [],      // initialize empty array
        created_at: new Date(),   // initialize creation date
      });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Google sync error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
