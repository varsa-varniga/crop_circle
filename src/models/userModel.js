import mongoose from "mongoose";
import CropCircle from "./cropCircleModel.js";

const userSchema = new mongoose.Schema({
  uid: { type: String, unique: true, sparse: true }, // Google UID

  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  googleLogin: { type: Boolean, default: true },

  profile_photo: { type: String, default: "" },
  bio: { type: String, default: "" },
  date_of_birth: { type: Date },
  isMentor: { type: Boolean, default: false },

  experience_level: {
    type: String,
    enum: ["beginner", "intermediate", "expert"],
    default: "beginner",
  },

  joined_circles: {          // Keep this for CropCircle tracking
    type: [mongoose.Schema.Types.ObjectId],
    ref: "CropCircle",
    default: []
  },

  created_at: { type: Date, default: Date.now },
});

// Automatically update mentors in crop circles
userSchema.pre("save", async function(next) {
  if (!this.isModified("experience_level")) return next();
  try {
    if (this.experience_level === "expert") {
      await CropCircle.updateMany(
        { members: this._id, mentors: { $ne: this._id } },
        { $push: { mentors: this._id } }
      );
    } else {
      await CropCircle.updateMany(
        { mentors: this._id },
        { $pull: { mentors: this._id } }
      );
    }
    next();
  } catch (err) {
    console.error("Error updating mentor roles:", err);
    next(err);
  }
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
