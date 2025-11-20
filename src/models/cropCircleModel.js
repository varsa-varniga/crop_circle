// models/cropCircleModel.js
import mongoose from "mongoose";

const cropCircleSchema = new mongoose.Schema({
  crop_name: { type: String, required: true },
  district: { type: String, required: true },

  // All circle members (includes learners and mentors)
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // Separate list for mentors (subset of members)
  mentors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // Optional for future community interactions
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],

  // Easy way to get counts without expensive queries
  stats: {
    total_members: { type: Number, default: 0 },
    total_mentors: { type: Number, default: 0 },
  },

  created_at: { type: Date, default: Date.now },
});

// 🔁 Pre-save middleware to auto-update stats
cropCircleSchema.pre("save", function (next) {
  this.stats.total_members = this.members.length;
  this.stats.total_mentors = this.mentors.length;
  next();
});

// ✅ ESM export
const CropCircle = mongoose.model("CropCircle", cropCircleSchema);
export default CropCircle;
