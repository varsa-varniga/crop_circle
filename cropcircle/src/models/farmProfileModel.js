import mongoose from "mongoose";

const farmProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true
  },
  farmName: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  cropsGrown: {
    type: [String],
    default: []
  },
  averageYield: {
    type: Number,
    min: 0
  },
  farmPhotos: {
    type: [String],
    default: []
  },
  badges: {
    organic: { type: Boolean, default: false },
    waterSaving: { type: Boolean, default: false },
    ecoFriendly: { type: Boolean, default: false },
    zeroPesticide: { type: Boolean, default: false }
  },
  gpsLocation: {
    latitude: { type: String, default: '' },
    longitude: { type: String, default: '' }
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Compound index to ensure one farm profile per user
farmProfileSchema.index({ userId: 1 }, { unique: true });

export default mongoose.model("FarmProfile", farmProfileSchema);