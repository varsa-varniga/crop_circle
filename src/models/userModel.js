import mongoose from "mongoose";
import CropCircle from "./cropCircleModel.js";

const userSchema = new mongoose.Schema({
  // Google UID (optional for manual users)
  uid: { type: String, unique: true, sparse: true },

  // Common fields
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },

  // Password required only for manual users
  password: {
    type: String,
    required: function () {
      return !this.googleLogin;
    },
  },

  // Flag to distinguish Google login users
  googleLogin: { type: Boolean, default: false },

  // Profile info
  profile_photo: { type: String, default: "" },
  bio: { type: String, default: "" },
  date_of_birth: { type: Date },

  // Experience level for mentor logic
  experience_level: {
    type: String,
    enum: ["beginner", "intermediate", "expert"],
    default: "beginner",
  },

  // Optional: track which circle the user joined for quick check
  joined_circle: { type: mongoose.Schema.Types.ObjectId, ref: "CropCircle" },

  created_at: { type: Date, default: Date.now },
});

// --------------------------
// Automatically update mentor roles in crop circles
// --------------------------
userSchema.pre("save", async function (next) {
  if (!this.isModified("experience_level")) return next();

  try {
    if (this.experience_level === "expert") {
      // Add user to mentors in all circles they belong to
      await CropCircle.updateMany(
        { members: this._id, mentors: { $ne: this._id } },
        { $push: { mentors: this._id } }
      );
    } else {
      // Remove user from mentors if no longer expert
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
