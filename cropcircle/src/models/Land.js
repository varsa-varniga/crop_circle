import mongoose from 'mongoose';

const landSchema = new mongoose.Schema({
  // Your existing land schema here...
  state: { type: String, required: true },
  district: { type: String, required: true },
  taluk: String,
  village: { type: String, required: true },
  surveyNumber: { type: String, required: true },
  gpsLat: String,
  gpsLng: String,
  pincode: String,
  landmark: String,
  totalArea: { type: Number, required: true },
  availableArea: Number,
  areaUnit: { type: String, default: 'acres' },
  soilType: { type: String, required: true },
  topography: String,
  currentLandUse: String,
  waterSources: [String],
  waterQuality: String,
  irrigationType: String,
  waterAvailability: String,
  electricityAvailable: { type: Boolean, default: false },
  electricityType: String,
  powerBackup: { type: Boolean, default: false },
  roadType: String,
  roadDistance: String,
  storageAvailable: { type: Boolean, default: false },
  storageCapacity: String,
  suitableCrops: [String],
  previousCrops: String,
  organicOnly: { type: Boolean, default: false },
  restrictions: String,
  certifications: String,
  minLeaseDuration: { type: Number, required: true },
  maxLeaseDuration: Number,
  leaseDurationType: { type: String, default: 'years' },
  expectedRent: { type: Number, required: true },
  rentFrequency: { type: String, default: 'yearly' },
  advanceRequired: { type: Boolean, default: false },
  advanceAmount: Number,
  additionalCosts: String,
  negotiable: { type: Boolean, default: true },
  farmerName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: String,
  experience: String,
  preferredContact: { type: String, default: 'phone' },
  languagesSpoken: String,
  availableFrom: Date,
  preferredLessee: { type: String, default: 'any' },
  supportServices: String,
  specialConditions: String,
  ownershipDocs: [String],
  identityDocs: [String],
  surveyDocs: [String],
  bankDocs: [String],
  soilTestDocs: [String],
  photos: [String],
  videos: [String],
  status: { 
    type: String, 
    default: 'pending',
    enum: ['pending', 'approved', 'rejected']
  },
  termsAccepted: { type: Boolean, default: false },
  accuracyConfirmed: { type: Boolean, default: false },
  verifiedBy: String,
  verifiedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

landSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Land = mongoose.model('Land', landSchema);
export default Land;