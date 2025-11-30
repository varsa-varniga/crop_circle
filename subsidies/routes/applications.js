const express = require('express');
const Application = require('../models/Application');
const Scheme = require('../models/Scheme');
const User = require('../models/User');
const router = express.Router();

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

    const jwt = require('jsonwebtoken');
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

// @route   POST /api/applications
// @desc    Create a new scheme application
// @access  Private
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { schemeId, applicantData, documents } = req.body;

    // Check if scheme exists
    const scheme = await Scheme.findById(schemeId);
    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found'
      });
    }

    // Check if user already applied for this scheme
    const existingApplication = await Application.findOne({
      user: req.user._id,
      scheme: schemeId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this scheme'
      });
    }

    // Create application
    const application = await Application.create({
      user: req.user._id,
      scheme: schemeId,
      applicantData: applicantData || {
        fullName: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        address: {
          district: req.user.financialProfile.district,
          state: req.user.financialProfile.state,
          pincode: req.user.financialProfile.pincode
        },
        landDetails: {
          size: req.user.financialProfile.landSize,
          ownership: req.user.financialProfile.landOwnership,
          crops: req.user.financialProfile.crops,
          soilType: req.user.financialProfile.soilType
        },
        incomeDetails: {
          annualIncome: req.user.financialProfile.annualIncome,
          incomeSource: req.user.financialProfile.incomeSource
        }
      },
      documents: documents || req.user.financialProfile.documents,
      status: 'submitted',
      submittedAt: new Date()
    });

    // Populate application details
    await application.populate('scheme');

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully! 📝',
      application: {
        id: application._id,
        applicationId: application.applicationId,
        scheme: {
          name: application.scheme.name,
          benefit: application.scheme.benefit
        },
        status: application.status,
        statusInTamil: application.getStatusInTamil(),
        submittedAt: application.submittedAt
      }
    });

  } catch (error) {
    console.error('Application error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting application',
      error: error.message
    });
  }
});

// @route   GET /api/applications
// @desc    Get user's applications
// @access  Private
router.get('/', authenticateUser, async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user._id })
      .populate('scheme', 'name nameInTamil benefit benefitAmount category')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      applications: applications.map(app => ({
        id: app._id,
        applicationId: app.applicationId,
        scheme: app.scheme,
        status: app.status,
        statusInTamil: app.getStatusInTamil(),
        submittedAt: app.submittedAt,
        processingTime: app.getProcessingTime(),
        canTrack: ['submitted', 'under_review', 'approved', 'disbursed'].includes(app.status)
      }))
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
});

// @route   GET /api/applications/:id
// @desc    Get single application details
// @access  Private
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('scheme').populate('user', 'name email phone');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      application: {
        id: application._id,
        applicationId: application.applicationId,
        scheme: application.scheme,
        status: application.status,
        statusInTamil: application.getStatusInTamil(),
        timeline: {
          submitted: application.submittedAt,
          reviewed: application.reviewedAt,
          approved: application.approvedAt,
          rejected: application.rejectedAt,
          disbursed: application.disbursedAt
        },
        applicantData: application.applicantData,
        documents: application.documents,
        reviewComments: application.reviewComments,
        rejectionReason: application.rejectionReason,
        processingTime: application.getProcessingTime()
      }
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application',
      error: error.message
    });
  }
});

// @route   GET /api/applications/track/:applicationId
// @desc    Track application status
// @access  Private
router.get('/track/:applicationId', authenticateUser, async (req, res) => {
  try {
    const application = await Application.findOne({
      applicationId: req.params.applicationId,
      user: req.user._id
    }).populate('scheme', 'name nameInTamil processingTime');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Generate tracking timeline
    const timeline = [];
    
    if (application.submittedAt) {
      timeline.push({
        step: 'submitted',
        title: 'Application Submitted',
        titleInTamil: 'விண்ணப்பம் சமர்ப்பிக்கப்பட்டது',
        date: application.submittedAt,
        completed: true
      });
    }

    if (application.reviewedAt) {
      timeline.push({
        step: 'reviewed',
        title: 'Under Review',
        titleInTamil: 'மதிப்பீட்டில்',
        date: application.reviewedAt,
        completed: true
      });
    }

    if (application.approvedAt) {
      timeline.push({
        step: 'approved',
        title: 'Application Approved',
        titleInTamil: 'விண்ணப்பம் அனுமதிக்கப்பட்டது',
        date: application.approvedAt,
        completed: true
      });
    }

    if (application.rejectedAt) {
      timeline.push({
        step: 'rejected',
        title: 'Application Rejected',
        titleInTamil: 'விண்ணப்பம் நிராகரிக்கப்பட்டது',
        date: application.rejectedAt,
        completed: true
      });
    }

    if (application.disbursedAt) {
      timeline.push({
        step: 'disbursed',
        title: 'Amount Disbursed',
        titleInTamil: 'தொகை வழங்கப்பட்டது',
        date: application.disbursedAt,
        completed: true
      });
    }

    // Add pending steps
    const currentStep = application.status;
    const steps = ['submitted', 'under_review', 'approved', 'disbursed'];
    const currentIndex = steps.indexOf(currentStep);

    if (currentIndex < steps.length - 1) {
      for (let i = currentIndex + 1; i < steps.length; i++) {
        timeline.push({
          step: steps[i],
          title: steps[i].replace('_', ' ').toUpperCase(),
          titleInTamil: 'பின்னணியில்',
          date: null,
          completed: false
        });
      }
    }

    res.json({
      success: true,
      application: {
        applicationId: application.applicationId,
        schemeName: application.scheme.name,
        schemeNameInTamil: application.scheme.nameInTamil,
        status: application.status,
        statusInTamil: application.getStatusInTamil(),
        expectedProcessingTime: application.scheme.processingTime,
        processingTime: application.getProcessingTime(),
        timeline
      }
    });
  } catch (error) {
    console.error('Error tracking application:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking application',
      error: error.message
    });
  }
});

module.exports = router;