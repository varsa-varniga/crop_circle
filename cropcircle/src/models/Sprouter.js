import mongoose from 'mongoose';

const sprouterSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  aadhaarLast4: { type: String, required: true },
  email: { type: String, trim: true, lowercase: true },
  address: {
    village: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  landDetails: {
    landSize: { type: Number, required: true },
    landType: { type: String, required: true, enum: ['owned', 'leased'] },
    soilType: { type: String, required: true, enum: ['red', 'black', 'sandy', 'clay', 'not_sure'] }
  },
  financialInfo: {
    incomeRange: { type: String, required: true },
    aadhaarDoc: { type: String },
    landProof: { type: String }
  },
  farmingExperience: {
    experience: { type: String, required: true },
    mainCrops: { type: String }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Sprouter = mongoose.model('Sprouter', sprouterSchema);
export default Sprouter;