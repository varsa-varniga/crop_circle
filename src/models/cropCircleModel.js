import mongoose from "mongoose";

const cropCircleSchema = new mongoose.Schema({
  crop_name: { type: String, required: true },
  district: { type: String, required: true },

  // All circle members (learners + mentors)
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // Mentors (subset of members)
  mentors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // Optional content for community interactions
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],

  // Stats to avoid expensive count queries
  stats: {
    total_members: { type: Number, default: 0 },
    total_mentors: { type: Number, default: 0 },
  },

  // Timestamps for creation & updates
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// 🔁 Pre-save middleware to auto-update stats & updated_at timestamp
cropCircleSchema.pre("save", function (next) {
  this.stats.total_members = this.members.length;
  this.stats.total_mentors = this.mentors.length;
  this.updated_at = Date.now();
  next();
});
cropCircleSchema.index({ crop_name: 1, district: 1 }, { unique: true });

// ✅ ESM export
const CropCircle = mongoose.model("CropCircle", cropCircleSchema);
export default CropCircle;
