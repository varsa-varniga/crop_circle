const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheme: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scheme',
    required: true
  },
  
  // Application Details
  applicationId: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'approved', 'rejected', 'disbursed'],
    default: 'submitted'
  },
  
  // Application Data
  applicantData: {
    fullName: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      district: String,
      state: String,
      pincode: String
    },
    landDetails: {
      size: Number,
      ownership: String,
      crops: [String],
      soilType: String
    },
    incomeDetails: {
      annualIncome: Number,
      incomeSource: String
    }
  },
  
  // Documents (URLs to uploaded files)
  documents: {
    aadhar: String,
    landRecord: String,
    incomeProof: String,
    bankPassbook: String,
    photograph: String,
    otherDocuments: [String]
  },
  
  // Timeline
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date,
  approvedAt: Date,
  rejectedAt: Date,
  disbursedAt: Date,
  
  // Review Details
  reviewComments: String,
  rejectionReason: String,
  assignedOfficer: String,
  
  // Payment Details (if applicable)
  disbursementAmount: Number,
  disbursementDate: Date,
  transactionId: String
}, {
  timestamps: true
});

// Generate application ID before saving
applicationSchema.pre('save', async function(next) {
  if (this.isNew && !this.applicationId) {
    try {
      const count = await mongoose.model('Application').countDocuments();
      this.applicationId = `APP${String(count + 1).padStart(6, '0')}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Method to get application status in Tamil
applicationSchema.methods.getStatusInTamil = function() {
  const statusMap = {
    'submitted': 'சமர்ப்பிக்கப்பட்டது',
    'under_review': 'மதிப்பீட்டில்',
    'approved': 'அனுமதிக்கப்பட்டது',
    'rejected': 'நிராகரிக்கப்பட்டது',
    'disbursed': 'வழங்கப்பட்டது'
  };
  return statusMap[this.status] || this.status;
};

// Method to calculate processing time
applicationSchema.methods.getProcessingTime = function() {
  if (!this.submittedAt) return null;
  
  const endDate = this.disbursedAt || this.rejectedAt || this.approvedAt || new Date();
  return Math.ceil((endDate - this.submittedAt) / (1000 * 60 * 60 * 24)); // days
};

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;