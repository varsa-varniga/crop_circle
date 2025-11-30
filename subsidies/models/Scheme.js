// models/Scheme.js - Government Scheme Schema
const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Scheme name is required'],
    unique: true,
    trim: true
  },
  nameInTamil: {
    type: String,
    trim: true
  },
  
  // Scheme Details
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  descriptionInTamil: {
    type: String
  },
  
  // Scheme Category
  category: {
    type: String,
    enum: ['loan', 'subsidy', 'insurance', 'training', 'equipment', 'infrastructure', 'other'],
    required: true
  },
  
  // Benefits
  benefit: {
    type: String,
    required: [true, 'Benefit details are required']
  },
  benefitAmount: {
    type: Number, // in rupees
    default: 0
  },
  benefitType: {
    type: String,
    enum: ['one-time', 'recurring', 'percentage-based', 'variable','loan'],
    default: 'one-time'
  },
  
  // Eligibility Criteria
  eligibility: {
    // Land requirements
    minLandSize: {
      type: Number,
      default: 0 // in acres
    },
    maxLandSize: {
      type: Number,
      default: Infinity
    },
    
    // Income requirements
    minIncome: {
      type: Number,
      default: 0
    },
    maxIncome: {
      type: Number,
      default: Infinity
    },
    
    // Crop types
    applicableCrops: [{
      type: String,
      trim: true
    }],
    cropRequired: {
      type: Boolean,
      default: false
    },
    
    // User roles eligible
    applicableRoles: [{
      type: String,
      enum: ['sprouter', 'cultivator', 'consumer', 'carbon_buyer', 'hub_employee', 'seller', 'rental_provider']
    }],
    
    // Location
    applicableStates: [{
      type: String,
      default: ['Tamil Nadu']
    }],
    applicableDistricts: [{
      type: String
    }],
    isNationwide: {
      type: Boolean,
      default: false
    },
    
    // Other requirements
    requiresKYC: {
      type: Boolean,
      default: true
    },
    requiresLandProof: {
      type: Boolean,
      default: false
    },
    ageLimit: {
      min: {
        type: Number,
        default: 18
      },
      max: {
        type: Number,
        default: 100
      }
    }
  },
  
  // Application Details
  applicationProcess: {
    type: String,
    required: true
  },
  requiredDocuments: [{
    type: String
  }],
  applicationFee: {
    type: Number,
    default: 0
  },
  
  // Timeline
  processingTime: {
    type: String, // e.g., "2-3 weeks"
    default: "4-6 weeks"
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Authority
  issuingAuthority: {
    type: String,
    required: true // e.g., "Government of India", "Tamil Nadu Agriculture Department"
  },
  officialWebsite: {
    type: String
  },
  contactNumber: {
    type: String
  },
  
  // Statistics
  totalApplications: {
    type: Number,
    default: 0
  },
  approvedApplications: {
    type: Number,
    default: 0
  },
  rejectedApplications: {
    type: Number,
    default: 0
  },
  
  // AI Matching Weights (for recommendation algorithm)
  matchingWeights: {
    landSizeWeight: {
      type: Number,
      default: 0.2
    },
    incomeWeight: {
      type: Number,
      default: 0.2
    },
    cropWeight: {
      type: Number,
      default: 0.15
    },
    locationWeight: {
      type: Number,
      default: 0.15
    },
    documentWeight: {
      type: Number,
      default: 0.3
    }
  }
}, {
  timestamps: true
});

// Indexes for faster queries
schemeSchema.index({ name: 1 });
schemeSchema.index({ category: 1 });
schemeSchema.index({ isActive: 1 });
schemeSchema.index({ 'eligibility.applicableStates': 1 });
schemeSchema.index({ 'eligibility.applicableDistricts': 1 });

// Method to check if user is eligible for this scheme
schemeSchema.methods.checkEligibility = function(user) {
  const fp = user.financialProfile;
  const el = this.eligibility;
  
  let eligible = true;
  let reasons = [];
  
  // Check land size
  if (fp.landSize < el.minLandSize) {
    eligible = false;
    reasons.push(`Land size should be at least ${el.minLandSize} acres`);
  }
  if (fp.landSize > el.maxLandSize) {
    eligible = false;
    reasons.push(`Land size should not exceed ${el.maxLandSize} acres`);
  }
  
  // Check income
  if (fp.annualIncome < el.minIncome) {
    eligible = false;
    reasons.push(`Annual income should be at least ₹${el.minIncome}`);
  }
  if (fp.annualIncome > el.maxIncome) {
    eligible = false;
    reasons.push(`Annual income should not exceed ₹${el.maxIncome}`);
  }
  
  // Check crops (if specific crops required)
  if (el.cropRequired && el.applicableCrops.length > 0) {
    const hasCrop = fp.crops.some(crop => 
      el.applicableCrops.includes(crop)
    );
    if (!hasCrop) {
      eligible = false;
      reasons.push(`Must grow one of: ${el.applicableCrops.join(', ')}`);
    }
  }
  
  // Check location
  if (!el.isNationwide) {
    if (!el.applicableStates.includes(fp.state)) {
      eligible = false;
      reasons.push(`Not available in ${fp.state}`);
    }
    if (el.applicableDistricts.length > 0 && !el.applicableDistricts.includes(fp.district)) {
      eligible = false;
      reasons.push(`Not available in ${fp.district} district`);
    }
  }
  
  // Check KYC
  if (el.requiresKYC && !fp.kycVerified) {
    eligible = false;
    reasons.push('KYC verification required');
  }
  
  // Check land proof
  if (el.requiresLandProof && !fp.documents.landRecord) {
    eligible = false;
    reasons.push('Land ownership proof required');
  }
  
  // Check role
  if (el.applicableRoles.length > 0 && !el.applicableRoles.includes(user.role)) {
    eligible = false;
    reasons.push(`Only available for: ${el.applicableRoles.join(', ')}`);
  }
  
  return {
    eligible,
    reasons,
    matchScore: eligible ? this.calculateMatchScore(user) : 0
  };
};

// Method to calculate match score (0-100)
schemeSchema.methods.calculateMatchScore = function(user) {
  let score = 0;
  const weights = this.matchingWeights;
  const fp = user.financialProfile;
  const el = this.eligibility;
  
  // Land size match
  if (fp.landSize >= el.minLandSize && fp.landSize <= el.maxLandSize) {
    score += weights.landSizeWeight * 100;
  }
  
  // Income match
  if (fp.annualIncome >= el.minIncome && fp.annualIncome <= el.maxIncome) {
    score += weights.incomeWeight * 100;
  }
  
  // Crop match
  if (el.applicableCrops.length === 0 || fp.crops.some(c => el.applicableCrops.includes(c))) {
    score += weights.cropWeight * 100;
  }
  
  // Location match
  if (el.isNationwide || el.applicableStates.includes(fp.state)) {
    score += weights.locationWeight * 100;
  }
  
  // Document completeness
  const docCount = Object.values(fp.documents).filter(d => d !== null).length;
  score += (docCount / 4) * weights.documentWeight * 100;
  
  return Math.round(score);
};

const Scheme = mongoose.model('Scheme', schemeSchema);

module.exports = Scheme;