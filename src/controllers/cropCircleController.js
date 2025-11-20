// src/controllers/cropCircleController.js
import CropCircle from "../models/cropCircleModel.js";
import User from "../models/userModel.js";
import { getDistrictFromGPS } from "../utils/geoUtils.js";

// Join or Create Crop Circle
export const joinOrCreateCircle = async (req, res) => {
  try {
    const { user_id, crop_name, gps_lat, gps_lng } = req.body;

    if (!user_id || !crop_name || !gps_lat || !gps_lng) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1️⃣ Detect district
    const district = await getDistrictFromGPS(gps_lat, gps_lng);
    if (!district) {
      return res.status(400).json({ message: "Unable to detect district" });
    }

    // 2️⃣ Fetch user info
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3️⃣ Find existing circle
    let circle = await CropCircle.findOne({ crop_name, district });

    if (circle) {
      // If already in circle, skip
      if (circle.members.includes(user_id)) {
        return res.status(200).json({
          message: `Already part of the Crop Circle for ${crop_name} in ${district}`,
          circle,
        });
      }

      // 4️⃣ Add user to circle
      circle.members.push(user_id);

      // 5️⃣ Assign mentor role if user is "expert"
      if (user.experience_level === "expert") {
        circle.mentors.push(user_id);
      }

      await circle.save();

      return res.status(200).json({
        message: `Joined existing Crop Circle for ${crop_name} in ${district}`,
        role: user.experience_level === "expert" ? "Mentor" : "Learner",
        circle,
      });
    }

    // 6️⃣ Create new circle if none exists
    const mentors = user.experience_level === "expert" ? [user_id] : [];
    circle = new CropCircle({
      crop_name,
      district,
      members: [user_id],
      mentors,
    });

    await circle.save();

    return res.status(201).json({
      message: `Created new Crop Circle for ${crop_name} in ${district}`,
      role: user.experience_level === "expert" ? "Mentor" : "Learner",
      circle,
    });
  } catch (error) {
    console.error("Error joining/creating Crop Circle:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Manually assign a mentor to a crop circle (for testing)
export const assignMentor = async (req, res) => {
  try {
    const { circle_id, user_id } = req.body;

    if (!circle_id || !user_id) {
      return res.status(400).json({ message: "circle_id and user_id are required" });
    }

    const circle = await CropCircle.findById(circle_id);
    if (!circle) {
      return res.status(404).json({ message: "Crop Circle not found" });
    }

    // Add mentor if not already present
    if (!circle.mentors.includes(user_id)) {
      circle.mentors.push(user_id);
      await circle.save();
    }

    return res.status(200).json({
      message: "Mentor assigned successfully",
      circle,
    });
  } catch (error) {
    console.error("Error assigning mentor:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
