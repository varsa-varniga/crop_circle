import mongoose from "mongoose";
import CropCircle from "./cropCircleModel.js";

const userSchema = new mongoose.Schema({
  // Google UID (optional for manual users)
  uid: { type: String, unique: true, sparse: true },

  // Common fields
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },

  // Password is required only for manual users
  password: {
    type: String,
    required: function () {
      return !this.googleLogin;
    },
  },

  // Flag to distinguish Google login users
  googleLogin: { type: Boolean, default: false },

  // Profile info
  // Store either a URL (for Google) or file path (for uploaded image)
  profile_photo: { type: String, default: "" },
  bio: { type: String, default: "" },
  date_of_birth: { type: Date },

  // Experience level for mentor logic
  experience_level: {
    type: String,
    enum: ["beginner", "intermediate", "expert"],
    default: "beginner",
  },

  created_at: { type: Date, default: Date.now },
});

// --------------------------
// Mentor / Expert logic
// --------------------------
userSchema.pre("save", async function (next) {
  if (!this.isModified("experience_level")) return next();

  try {
    if (this.experience_level === "expert") {
      await CropCircle.updateMany(
        { members: this._id, mentors: { $ne: this._id } },
        { $push: { mentors: this._id } }
      );
    }

    if (this.experience_level !== "expert") {
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
