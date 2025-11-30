const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: false, // Made optional for auto-registration
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  
  // User Role
  role: {
    type: String,
    enum: ['sprouter', 'cultivator', 'consumer', 'carbon_buyer', 'hub_employee', 'seller', 'rental_provider'],
    default: 'sprouter'
  },
  
  // Language Preference - FIXED ENUM VALUES
  language: {
    type: String,
    enum: ['ta', 'en', 'hi'],
    default: 'ta'
  },
  
  // Auto-registration flag
  autoRegistered: {
    type: Boolean,
    default: false
  },
  
  // Financial Profile (for Financial Empowerment Center)
  financialProfile: {
    // Farm Details
    landSize: {
      type: Number, // in acres
      default: 0
    },
    landOwnership: {
      type: String,
      enum: ['owned', 'leased', 'family', 'none'],
      default: 'none'
    },
    
    // Income Information
    annualIncome: {
      type: Number,
      default: 0
    },
    incomeSource: {
      type: String,
      enum: ['farming', 'labor', 'mixed', 'other'],
      default: 'farming'
    },
    
    // Crop Information
    crops: [{
      type: String,
      trim: true
    }],
    
    // Location
    district: {
      type: String,
      required: false, // Made optional for auto-registration
      trim: true
    },
    state: {
      type: String,
      default: 'Tamil Nadu'
    },
    pincode: {
      type: String,
      match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode'],
      required: false
    },
    
    // Soil & Water
    soilType: {
      type: String,
      enum: ['Loamy', 'Sandy', 'Clay', 'Red', 'Black', 'Alluvial', 'Unknown'],
      default: 'Unknown'
    },
    waterAccess: {
      type: String,
      enum: ['Borewell', 'Canal', 'Rainfed', 'River', 'Pond', 'Mixed'],
      default: 'Rainfed'
    },
    
    // Financial History
    pastLoans: {
      type: Boolean,
      default: false
    },
    loanAmount: {
      type: Number,
      default: 0
    },
    loanStatus: {
      type: String,
      enum: ['none', 'active', 'repaid', 'defaulted'],
      default: 'none'
    },
    
    // Documents (URLs to uploaded files)
    documents: {
      aadhar: {
        type: String,
        default: null
      },
      landRecord: {
        type: String,
        default: null
      },
      incomeProof: {
        type: String,
        default: null
      },
      bankPassbook: {
        type: String,
        default: null
      }
    },
    
    // KYC Status
    kycVerified: {
      type: Boolean,
      default: false
    },
    kycVerifiedAt: {
      type: Date,
      default: null
    }
  },
  
  // Tokens & Credits
  farmTokens: {
    type: Number,
    default: 0
  },
  carbonCredits: {
    type: Number,
    default: 0
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
  profileCreatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ 'financialProfile.district': 1 });

// Virtual field to get full address
userSchema.virtual('fullAddress').get(function() {
  return `${this.financialProfile.district}, ${this.financialProfile.state} - ${this.financialProfile.pincode}`;
});

// Custom validation for phone - only validate if phone exists
userSchema.path('phone').validate(function(phone) {
  // If phone is not provided (for auto-registered users), skip validation
  if (!phone || phone === '+910000000000') {
    return true;
  }
  // If phone is provided, validate it
  return /^[0-9]{10}$/.test(phone);
}, 'Please enter a valid 10-digit phone number');

// Custom validation for district - only validate if district exists
userSchema.path('financialProfile.district').validate(function(district) {
  // If district is not provided (for auto-registered users), skip validation
  if (!district || district === 'Unknown District') {
    return true;
  }
  // If district is provided, validate it's not empty
  return district.trim().length > 0;
}, 'Please enter a valid district');

// Method to check if user has completed financial profile
userSchema.methods.isFinancialProfileComplete = function() {
  const fp = this.financialProfile;
  return fp.landSize > 0 && 
         fp.annualIncome > 0 && 
         fp.district && fp.district !== 'Unknown District' &&
         fp.crops.length > 0;
};

// Method to calculate eligibility score (0-100)
userSchema.methods.calculateEligibilityScore = function() {
  let score = 0;
  const fp = this.financialProfile;
  
  // Has land
  if (fp.landSize > 0) score += 20;
  
  // Has crops registered
  if (fp.crops.length > 0) score += 15;
  
  // KYC verified
  if (fp.kycVerified) score += 25;
  
  // Has documents
  const docs = fp.documents;
  if (docs.aadhar) score += 10;
  if (docs.landRecord) score += 10;
  if (docs.incomeProof) score += 10;
  if (docs.bankPassbook) score += 10;
  
  // Basic profile completion
  if (this.name && this.name !== 'Sprouter User') score += 5;
  if (this.phone && this.phone !== '+910000000000') score += 5;
  if (fp.district && fp.district !== 'Unknown District') score += 5;
  
  return Math.min(score, 100);
};

// Method to get language name
userSchema.methods.getLanguageName = function() {
  const languageMap = {
    'ta': 'Tamil',
    'en': 'English', 
    'hi': 'Hindi'
  };
  return languageMap[this.language] || 'Tamil';
};

// Method to check if user is auto-registered
userSchema.methods.isAutoRegistered = function() {
  return this.autoRegistered;
};

// Method to update profile from main app data
userSchema.methods.updateFromMainApp = function(mainAppData) {
  if (mainAppData.fullName && this.name === 'Sprouter User') {
    this.name = mainAppData.fullName;
  }
  if (mainAppData.phone && this.phone === '+910000000000') {
    this.phone = mainAppData.phone;
  }
  if (mainAppData.district && this.financialProfile.district === 'Unknown District') {
    this.financialProfile.district = mainAppData.district;
  }
  if (mainAppData.landSize && this.financialProfile.landSize === 0) {
    this.financialProfile.landSize = mainAppData.landSize;
  }
  return this.save();
};

// Static method to find or create auto-registered user
userSchema.statics.findOrCreateAutoUser = async function(userData) {
  const { email, name, phone, district } = userData;
  
  // Check if user exists
  let user = await this.findOne({ email: email.toLowerCase() });
  
  if (user) {
    return user;
  }
  
  // Create new auto-registered user
  user = new this({
    name: name || 'Sprouter User',
    email: email.toLowerCase(),
    phone: phone || '+910000000000',
    password: await require('bcryptjs').hash('default123', 10),
    district: district || 'Unknown District',
    role: 'sprouter',
    language: 'ta',
    autoRegistered: true,
    financialProfile: {
      district: district || 'Unknown District',
      state: 'Tamil Nadu'
    }
  });
  
  await user.save();
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;