import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String, // Format: "2025-11-15"
    required: true
  },
  available: {
    type: Boolean,
    default: false
  },
  timeSlots: {
    morning: { type: Boolean, default: false },
    afternoon: { type: Boolean, default: false },
    evening: { type: Boolean, default: false }
  },
  notes: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

// Compound index to ensure one availability entry per user per date
availabilitySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("Availability", availabilitySchema);