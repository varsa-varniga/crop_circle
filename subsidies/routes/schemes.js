const express = require('express');
const router = express.Router();
const Scheme = require('../models/Scheme');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { getString, getLanguageFromRequest } = require('../utils/languageHelper');
const { authenticateAdmin, requireRole } = require('../middleware/adminAuth');

// Middleware to verify JWT token
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: getString('auth.token.missing', 'en')
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
        message: getString('auth.user.not_found', 'en')
      });
    }

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: getString('auth.token.invalid', 'en'),
      error: error.message
    });
  }
};

// @route   POST /api/schemes
// @desc    Add a new government scheme (Admin only for now)
// @access  Public (should be Admin only in production)
router.post('/', async (req, res) => {
  try {
    const scheme = await Scheme.create(req.body);
    const language = req.query.lang || 'ta';
    
    res.status(201).json({
      success: true,
      message: getString('scheme.add.success', language),
      scheme
    });
  } catch (error) {
    console.error('Error adding scheme:', error);
    res.status(500).json({
      success: false,
      message: getString('server.error', 'en'),
      error: error.message
    });
  }
});

// @route   GET /api/schemes
// @desc    Get all active schemes
// @access  Public
// @route   GET /api/schemes
// @desc    Get all active schemes
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, state, district, lang } = req.query;
    const language = lang || 'ta';
    
    console.log('🔍 Fetching schemes with filter:', { category, state, district });
    
    // Build filter
    const filter = { isActive: true };
    
    if (category) filter.category = category;
    if (state) filter['eligibility.applicableStates'] = state;
    if (district) filter['eligibility.applicableDistricts'] = district;
    
    console.log('🔍 Final filter:', filter);
    
    const schemes = await Scheme.find(filter).sort({ createdAt: -1 });
    
    console.log(`📊 Found ${schemes.length} schemes in database`);
    
    // Log scheme names for debugging
    schemes.forEach((scheme, index) => {
      console.log(`${index + 1}. ${scheme.name} (${scheme.category})`);
    });
    
    res.json({
      success: true,
      count: schemes.length,
      schemes
    });
  } catch (error) {
    console.error('Error fetching schemes:', error);
    res.status(500).json({
      success: false,
      message: getString('server.error', 'en'),
      error: error.message
    });
  }
});
// @route   GET /api/schemes/:id
// @desc    Get single scheme by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const scheme = await Scheme.findById(req.params.id);
    const language = req.query.lang || 'ta';
    
    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: getString('scheme.not_found', language)
      });
    }
    
    res.json({
      success: true,
      scheme
    });
  } catch (error) {
    console.error('Error fetching scheme:', error);
    res.status(500).json({
      success: false,
      message: getString('server.error', 'en'),
      error: error.message
    });
  }
});

// @route   POST /api/schemes/recommend
// @desc    Get personalized scheme recommendations for user
// @access  Private
router.post('/recommend', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const userLanguage = user.language || 'ta';
    
    // Get all active schemes
    const allSchemes = await Scheme.find({ isActive: true });
    
    // Calculate eligibility for each scheme
    const recommendations = allSchemes
      .map(scheme => {
        const eligibilityResult = scheme.checkEligibility(user);
        
        return {
          scheme: {
            id: scheme._id,
            name: scheme.name,
            nameInTamil: scheme.nameInTamil,
            description: userLanguage === 'ta' && scheme.descriptionInTamil ? scheme.descriptionInTamil : scheme.description,
            category: scheme.category,
            benefit: scheme.benefit,
            benefitAmount: scheme.benefitAmount,
            processingTime: scheme.processingTime,
            applicationFee: scheme.applicationFee,
            requiredDocuments: scheme.requiredDocuments,
            issuingAuthority: scheme.issuingAuthority,
            officialWebsite: scheme.officialWebsite
          },
          eligible: eligibilityResult.eligible,
          matchScore: eligibilityResult.matchScore,
          reasons: eligibilityResult.reasons
        };
      })
      .filter(rec => rec.eligible) // Only show eligible schemes
      .sort((a, b) => b.matchScore - a.matchScore) // Sort by match score
      .slice(0, 10); // Top 10 recommendations
    
    const message = recommendations.length > 0 
      ? getString('scheme.recommendations.found', userLanguage, { count: recommendations.length })
      : getString('scheme.recommendations.none', userLanguage);
    
    res.json({
      success: true,
      message,
      count: recommendations.length,
      recommendations,
      userProfile: {
        name: user.name,
        district: user.financialProfile.district,
        landSize: user.financialProfile.landSize,
        income: user.financialProfile.annualIncome,
        crops: user.financialProfile.crops,
        eligibilityScore: user.calculateEligibilityScore()
      }
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      message: getString('server.error', 'en'),
      error: error.message
    });
  }
});

// @route   GET /api/schemes/check-eligibility/:schemeId
// @desc    Check if user is eligible for a specific scheme
// @access  Private
router.get('/check-eligibility/:schemeId', authenticateUser, async (req, res) => {
  try {
    const scheme = await Scheme.findById(req.params.schemeId);
    const userLanguage = req.user.language || 'ta';
    
    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: getString('scheme.not_found', userLanguage)
      });
    }
    
    const eligibilityResult = scheme.checkEligibility(req.user);
    
    const message = eligibilityResult.eligible
      ? getString('scheme.eligible', userLanguage, { 
          schemeName: userLanguage === 'ta' && scheme.nameInTamil ? scheme.nameInTamil : scheme.name, 
          score: eligibilityResult.matchScore 
        })
      : getString('scheme.not_eligible', userLanguage, { 
          schemeName: userLanguage === 'ta' && scheme.nameInTamil ? scheme.nameInTamil : scheme.name,
          reasons: eligibilityResult.reasons.join('. ') 
        });
    
    res.json({
      success: true,
      scheme: {
        name: scheme.name,
        nameInTamil: scheme.nameInTamil,
        benefit: scheme.benefit
      },
      eligible: eligibilityResult.eligible,
      matchScore: eligibilityResult.matchScore,
      reasons: eligibilityResult.reasons,
      message
    });
  } catch (error) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({
      success: false,
      message: getString('server.error', 'en'),
      error: error.message
    });
  }
});

// @route   PUT /api/schemes/:id
// @desc    Update scheme (Admin only)
// @access  Public (should be Admin only in production)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const scheme = await Scheme.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    const language = req.query.lang || 'ta';
    
    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: getString('scheme.not_found', language)
      });
    }
    
    res.json({
      success: true,
      message: getString('scheme.update.success', language),
      scheme
    });
  } catch (error) {
    console.error('Error updating scheme:', error);
    res.status(500).json({
      success: false,
      message: getString('server.error', 'en'),
      error: error.message
    });
  }
});

// @route   DELETE /api/schemes/:id
// @desc    Delete scheme (Admin only)
// @access  Public (should be Admin only in production)
router.delete('/:id',authenticateUser,requireRole('admin'), async (req, res) => {
  try {
    const scheme = await Scheme.findByIdAndDelete(req.params.id);
    const language = req.query.lang || 'ta';
    
    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: getString('scheme.not_found', language)
      });
    }
    
    res.json({
      success: true,
      message: getString('scheme.delete.success', language)
    });
  } catch (error) {
    console.error('Error deleting scheme:', error);
    res.status(500).json({
      success: false,
      message: getString('server.error', 'en'),
      error: error.message
    });
  }
});

module.exports = router;