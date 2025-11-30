// routes/users.js - User Profile Management Routes
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login first.'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'agrovihan_secret_key_2025'
    );

    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};

// @route   PUT /api/users/profile/verify-kyc (Testing only)
// @desc    Manually verify KYC for testing purposes
// @access  Private
router.put('/profile/verify-kyc', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    user.financialProfile.kycVerified = true;
    user.financialProfile.kycVerifiedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'KYC manually verified for testing! ✅',
      kycVerified: true,
      eligibilityScore: user.calculateEligibilityScore()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying KYC',
      error: error.message
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user's financial profile
// @access  Private
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const {
      landSize,
      landOwnership,
      annualIncome,
      incomeSource,
      crops,
      district,
      state,
      pincode,
      soilType,
      waterAccess,
      pastLoans,
      loanAmount,
      loanStatus
    } = req.body;

    // Build update object
    const updates = {};
    
    if (landSize !== undefined) updates['financialProfile.landSize'] = landSize;
    if (landOwnership) updates['financialProfile.landOwnership'] = landOwnership;
    if (annualIncome !== undefined) updates['financialProfile.annualIncome'] = annualIncome;
    if (incomeSource) updates['financialProfile.incomeSource'] = incomeSource;
    if (crops) updates['financialProfile.crops'] = crops;
    if (district) updates['financialProfile.district'] = district;
    if (state) updates['financialProfile.state'] = state;
    if (pincode) updates['financialProfile.pincode'] = pincode;
    if (soilType) updates['financialProfile.soilType'] = soilType;
    if (waterAccess) updates['financialProfile.waterAccess'] = waterAccess;
    if (pastLoans !== undefined) updates['financialProfile.pastLoans'] = pastLoans;
    if (loanAmount !== undefined) updates['financialProfile.loanAmount'] = loanAmount;
    if (loanStatus) updates['financialProfile.loanStatus'] = loanStatus;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully! ✅',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        financialProfile: user.financialProfile,
        eligibilityScore: user.calculateEligibilityScore(),
        profileComplete: user.isFinancialProfileComplete()
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// @route   POST /api/users/profile/documents
// @desc    Upload/update user documents with auto-KYC verification
// @access  Private
router.post('/profile/documents', authenticateUser, async (req, res) => {
  try {
    const { aadhar, landRecord, incomeProof, bankPassbook } = req.body;

    console.log('📄 Document update request:', { aadhar: !!aadhar, landRecord: !!landRecord, incomeProof: !!incomeProof });

    // Build updates object
    const updates = {};
    if (aadhar) updates['financialProfile.documents.aadhar'] = aadhar;
    if (landRecord) updates['financialProfile.documents.landRecord'] = landRecord;
    if (incomeProof) updates['financialProfile.documents.incomeProof'] = incomeProof;
    if (bankPassbook) updates['financialProfile.documents.bankPassbook'] = bankPassbook;

    // Update documents
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    );

    // ✅ AUTO-KYC VERIFICATION
    const docs = user.financialProfile.documents;
    const hasAllRequiredDocuments = docs.aadhar && docs.landRecord && docs.incomeProof;
    
    let kycJustVerified = false;
    
    if (hasAllRequiredDocuments && !user.financialProfile.kycVerified) {
      user.financialProfile.kycVerified = true;
      user.financialProfile.kycVerifiedAt = new Date();
      await user.save();
      kycJustVerified = true;
      
      console.log('✅ KYC Auto-verified for user:', user.email);
      
      // Optional: Send notification (only if NotificationService is available)
      try {
        const NotificationService = require('../services/notificationService');
        await NotificationService.sendNotification(user, {
          type: 'kyc_verified',
          variables: { score: user.calculateEligibilityScore() }
        });
      } catch (notifError) {
        console.log('⚠️ Notification service not available (non-critical)');
      }
    }

    res.json({
      success: true,
      message: kycJustVerified 
        ? 'Documents updated successfully! KYC verified automatically! 🎉📄' 
        : 'Documents updated successfully! 📄',
      documents: user.financialProfile.documents,
      kycVerified: user.financialProfile.kycVerified,
      kycJustVerified: kycJustVerified,
      eligibilityScore: user.calculateEligibilityScore()
    });
  } catch (error) {
    console.error('❌ Error updating documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating documents',
      error: error.message
    });
  }
});

// @route   PUT /api/users/profile/kyc
// @desc    Update KYC verification status (Manual override)
// @access  Private (should be Admin only in production)
router.put('/profile/kyc', authenticateUser, async (req, res) => {
  try {
    const { verified } = req.body;

    const updates = {
      'financialProfile.kycVerified': verified,
      'financialProfile.kycVerifiedAt': verified ? new Date() : null
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    );

    res.json({
      success: true,
      message: verified ? 'KYC verified successfully! ✅' : 'KYC verification removed',
      kycStatus: {
        verified: user.financialProfile.kycVerified,
        verifiedAt: user.financialProfile.kycVerifiedAt
      },
      eligibilityScore: user.calculateEligibilityScore()
    });
  } catch (error) {
    console.error('Error updating KYC:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating KYC status',
      error: error.message
    });
  }
});

// @route   GET /api/users/profile
// @desc    Get user's complete profile
// @access  Private
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        language: user.language,
        financialProfile: user.financialProfile,
        farmTokens: user.farmTokens,
        carbonCredits: user.carbonCredits,
        eligibilityScore: user.calculateEligibilityScore(),
        profileComplete: user.isFinancialProfileComplete(),
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics with auto-KYC check
// @access  Private
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const eligibilityScore = user.calculateEligibilityScore();

    // Calculate profile completion percentage
    const fp = user.financialProfile;
    let completionItems = 0;
    let totalItems = 8;

    if (fp.landSize > 0) completionItems++;
    if (fp.annualIncome > 0) completionItems++;
    if (fp.crops.length > 0) completionItems++;
    if (fp.district) completionItems++;
    if (fp.soilType !== 'Unknown') completionItems++;
    if (fp.waterAccess) completionItems++;
    if (fp.documents.aadhar) completionItems++;
    if (fp.documents.landRecord) completionItems++;

    const completionPercentage = Math.round((completionItems / totalItems) * 100);

    // ✅ Count only the 3 main required documents
    const mainDocuments = ['aadhar', 'landRecord', 'incomeProof'];
    const documentsUploaded = mainDocuments.filter(doc => fp.documents[doc]).length;
    const totalDocuments = 3;

    // ✅ Auto-verify KYC when all required documents are uploaded
    const hasAllRequiredDocuments = documentsUploaded === totalDocuments;
    
    if (hasAllRequiredDocuments && !fp.kycVerified) {
      user.financialProfile.kycVerified = true;
      user.financialProfile.kycVerifiedAt = new Date();
      await user.save();
      console.log('✅ KYC Auto-verified during stats check for user:', user.email);
    }

    res.json({
      success: true,
      stats: {
        eligibilityScore,
        profileCompletionPercentage: completionPercentage,
        documentsUploaded: documentsUploaded,
        totalDocuments: totalDocuments,
        kycVerified: user.financialProfile.kycVerified,
        kycVerifiedAt: user.financialProfile.kycVerifiedAt,
        farmTokens: user.farmTokens,
        carbonCredits: user.carbonCredits,
        accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)),
        missingFields: [
          fp.landSize === 0 && 'Land Size',
          fp.annualIncome === 0 && 'Annual Income',
          fp.crops.length === 0 && 'Crops',
          fp.soilType === 'Unknown' && 'Soil Type',
          !fp.documents.aadhar && 'Aadhar Document',
          !fp.documents.landRecord && 'Land Record',
          !fp.documents.incomeProof && 'Income Proof'
        ].filter(Boolean)
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error.message
    });
  }
});

module.exports = router;