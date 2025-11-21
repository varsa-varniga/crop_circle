// src/controllers/cropCircleController.js
import CropCircle from "../models/cropCircleModel.js";
import User from "../models/userModel.js";

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: "User not found" });

  // validate password or Google login here
  
  let circle = null;
  if (user.joined_circle) {
    circle = await CropCircle.findById(user.joined_circle);
  }

  res.status(200).json({
    user,
    circle, // returns null if not joined yet
  });
};
// Join or Create Crop Circle (manual district selection)
export const joinOrCreateCircle = async (req, res) => {
  try {
    const { user_id, crop_name, district } = req.body;

    // ✅ Validate input
    if (!user_id || !crop_name || !district) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1️⃣ Fetch user
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1.5️⃣ Check if user already has a joined circle
    if (user.joined_circle) {
      const existingCircle = await CropCircle.findById(user.joined_circle);
      return res.status(200).json({
        message: `You have already joined a Crop Circle for ${existingCircle.crop_name} in ${existingCircle.district}`,
        circle: existingCircle,
      });
    }

    // 2️⃣ Find existing circle for crop + district
    let circle = await CropCircle.findOne({ crop_name, district });

    if (circle) {
      // Add user to circle if not already a member
      if (!circle.members.includes(user_id)) {
        circle.members.push(user_id);

        // Assign mentor role if user is expert
        if (user.experience_level === "expert" && !circle.mentors.includes(user_id)) {
          circle.mentors.push(user_id);
        }

        await circle.save();

        // Update user's joined_circle
        user.joined_circle = circle._id;
        await user.save();
      }

      return res.status(200).json({
        message: `Joined existing Crop Circle for ${crop_name} in ${district}`,
        role: user.experience_level === "expert" ? "Mentor" : "Learner",
        circle,
      });
    }

    // 3️⃣ Create new circle if none exists
    const mentors = user.experience_level === "expert" ? [user_id] : [];
    circle = new CropCircle({
      crop_name,
      district,
      members: [user_id],
      mentors,
    });

    await circle.save();

    // Update user's joined_circle
    user.joined_circle = circle._id;
    await user.save();

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

// Manually assign a mentor to a crop circle
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






// Check if user already joined a crop circle
export const getMyCircle = async (req, res) => {
  try {
    const { user_id } = req.query; // GET request query

    if (!user_id) return res.status(400).json({ message: "user_id is required" });

    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.joined_circle) {
      return res.status(200).json({ alreadyJoined: false });
    }

    // Fetch circle first
    const circle = await CropCircle.findById(user.joined_circle);

    // Determine role
    const role = circle.mentors.includes(user._id) ? "Mentor" : "Learner";

    return res.status(200).json({
      alreadyJoined: true,
      role,
      circle,
    });
  } catch (err) {
    console.error("Error fetching user circle:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
