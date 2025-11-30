// src/controllers/cropCircleController.js
import CropCircle from "../models/cropCircleModel.js";
import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";
import { generateCircleName } from "../utils/generateCirclename.js";


// Login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });


  if (!user) return res.status(404).json({ message: "User not found" });


  let circle = null;
  if (user.joined_circle) {
    circle = await CropCircle.findById(user.joined_circle);


    // Ensure circle has a name
    if (circle && !circle.name) {
      circle.name = generateCircleName(circle.crop_name, circle.district);
      await circle.save();
    }
  }


  res.status(200).json({ user, circle });
};


// Join or Create Crop Circle
// Join or create a crop circle
// controllers/cropCircleController.js


export const joinOrCreateCircle = async (req, res) => {
  try {
    const { user_id, crop_name, district } = req.body;

    if (!user_id || !crop_name || !district)
      return res.status(400).json({ message: "Missing required fields" });

    // 1️⃣ Find user by Mongo _id
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2️⃣ Normalize crop_name
    const normalizedCrop = crop_name.trim().toLowerCase();

    // 3️⃣ Check for existing circle
    let circle = await CropCircle.findOne({
      crop_name: { $regex: `^${normalizedCrop}$`, $options: "i" },
      district,
    });

    if (!circle) {
      // 4️⃣ CREATE new circle
      const circleName = generateCircleName(crop_name, district);
      const mentors = user.experience_level === "expert" ? [user_id] : [];
      circle = new CropCircle({
        name: circleName,
        crop_name: normalizedCrop,
        district,
        members: [user_id],
        mentors,
      });
      await circle.save();
    } else {
      // 5️⃣ JOIN existing circle
      if (!circle.members.includes(user_id)) {
        circle.members.push(user_id);
        if (user.experience_level === "expert" && !circle.mentors.includes(user_id)) {
          circle.mentors.push(user_id);
        }
        await circle.save();

        // 6️⃣ Notify existing members
        const existingMembers = circle.members.filter(m => m.toString() !== user_id.toString());
        for (let memberId of existingMembers) {
          await Notification.create({
            receiver: memberId,
            sender: user_id,
            type: "NEW_MEMBER",
            circle_id: circle._id,
            message: `${user.name} joined your Crop Circle`,
            isActive: false,
          });
        }
      }
    }

    // 7️⃣ Add circle to user's joined_circles
    if (!user.joined_circles.includes(circle._id)) {
      user.joined_circles.push(circle._id);
      await user.save();
    }

    // 8️⃣ Respond
    return res.status(200).json({
      message: `Joined/Created Crop Circle for ${crop_name} in ${district}`,
      role: user.experience_level === "expert" ? "Mentor" : "Learner",
      circle,
    });
  } catch (error) {
    console.error("Error joining/creating Crop Circle:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Get user's circle
export const getMyCircles = async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ message: "user_id is required" });


    const user = await User.findById(user_id).populate("joined_circles");
    if (!user) return res.status(404).json({ message: "User not found" });


    res.status(200).json({ circles: user.joined_circles });
  } catch (err) {
    console.error("Error fetching user circles:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};




// Assign mentor manually
export const assignMentor = async (req, res) => {
  try {
    const { circle_id, user_id } = req.body;


    if (!circle_id || !user_id)
      return res.status(400).json({ message: "circle_id and user_id are required" });


    const circle = await CropCircle.findById(circle_id);
    if (!circle) return res.status(404).json({ message: "Crop Circle not found" });


    if (!circle.mentors.includes(user_id)) {
      circle.mentors.push(user_id);
      await circle.save();
    }


    res.status(200).json({ message: "Mentor assigned successfully", circle });
  } catch (error) {
    console.error("Error assigning mentor:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Get circle by ID
export const getCircleById = async (req, res) => {
  try {
    const { id } = req.params;
    const circle = await CropCircle.findById(id);


    if (!circle) return res.status(404).json({ message: "Circle not found" });


    // Ensure circle has a name
    if (!circle.name) {
      circle.name = generateCircleName(circle.crop_name, circle.district);
      await circle.save();
    }


    res.status(200).json(circle);
  } catch (error) {
    console.error("Error fetching circle by ID:", error);
    res.status(500).json({ message: "Error fetching circle", error: error.message });
  }
};


