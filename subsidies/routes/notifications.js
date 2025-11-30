const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { getString } = require('../utils/languageHelper');

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

// @route   GET /api/notifications/test-service
// @desc    Test if notification service is working
// @access  Public
router.get('/test-service', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Notification service is running! ✅',
      timestamp: new Date().toISOString(),
      features: {
        multiLanguage: true,
        templateSystem: true,
        readyForIntegration: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Notification service test failed',
      error: error.message
    });
  }
});

// @route   POST /api/notifications/test
// @desc    Test notification templates
// @access  Private
router.post('/test', authenticateUser, async (req, res) => {
  try {
    const { notificationType = 'application_submitted' } = req.body;
    
    const userLanguage = req.user.language || 'ta';
    
    // Test notification content
    const testContent = {
      application_submitted: {
        title: getString('notification.application.submitted.title', userLanguage),
        body: getString('notification.application.submitted.body', userLanguage, {
          schemeName: 'PM-KISAN'
        }),
        email_subject: getString('notification.application.submitted.email_subject', userLanguage, {
          schemeName: 'PM-KISAN'
        }),
        email_body: getString('notification.application.submitted.email_body', userLanguage, {
          userName: req.user.name,
          schemeName: 'PM-KISAN',
          applicationId: 'TEST-001',
          processingTime: '2-3 weeks'
        })
      },
      application_approved: {
        title: getString('notification.application.approved.title', userLanguage),
        body: getString('notification.application.approved.body', userLanguage, {
          schemeName: 'PM-KISAN'
        }),
        email_subject: getString('notification.application.approved.email_subject', userLanguage, {
          schemeName: 'PM-KISAN'
        })
      },
      scheme_recommendation: {
        title: getString('notification.scheme.recommendation.title', userLanguage),
        body: getString('notification.scheme.recommendation.body', userLanguage, {
          count: '3'
        })
      },
      kyc_verified: {
        title: getString('notification.kyc.verified.title', userLanguage),
        body: getString('notification.kyc.verified.body', userLanguage, {
          score: '85'
        })
      }
    };

    const content = testContent[notificationType] || testContent.application_submitted;

    res.json({
      success: true,
      message: 'Notification template test successful!',
      notificationType,
      userLanguage,
      content: content,
      user: {
        name: req.user.name,
        email: req.user.email,
        language: req.user.language
      },
      externalServices: {
        email: 'Ready to configure',
        sms: 'Ready to configure', 
        push: 'Ready to configure'
      }
    });

  } catch (error) {
    console.error('Notification test error:', error);
    res.status(500).json({
      success: false,
      message: 'Notification test failed',
      error: error.message
    });
  }
});

// @route   GET /api/notifications/templates
// @desc    Get all notification templates
// @access  Private
router.get('/templates', authenticateUser, (req, res) => {
  try {
    const userLanguage = req.user.language || 'ta';
    
    const templates = {
      application_submitted: {
        title: getString('notification.application.submitted.title', userLanguage),
        body: getString('notification.application.submitted.body', userLanguage, {schemeName: '{schemeName}'}),
        email_subject: getString('notification.application.submitted.email_subject', userLanguage, {schemeName: '{schemeName}'}),
        sms: getString('notification.application.submitted.sms', userLanguage, {schemeName: '{schemeName}', applicationId: '{applicationId}'})
      },
      application_approved: {
        title: getString('notification.application.approved.title', userLanguage),
        body: getString('notification.application.approved.body', userLanguage, {schemeName: '{schemeName}'}),
        email_subject: getString('notification.application.approved.email_subject', userLanguage, {schemeName: '{schemeName}'}),
        sms: getString('notification.application.approved.sms', userLanguage, {schemeName: '{schemeName}', amount: '{amount}'})
      },
      scheme_recommendation: {
        title: getString('notification.scheme.recommendation.title', userLanguage),
        body: getString('notification.scheme.recommendation.body', userLanguage, {count: '{count}'}),
        email_subject: getString('notification.scheme.recommendation.email_subject', userLanguage, {count: '{count}'}),
        sms: getString('notification.scheme.recommendation.sms', userLanguage, {count: '{count}'})
      },
      kyc_verified: {
        title: getString('notification.kyc.verified.title', userLanguage),
        body: getString('notification.kyc.verified.body', userLanguage, {score: '{score}'}),
        email_subject: getString('notification.kyc.verified.email_subject', userLanguage),
        sms: getString('notification.kyc.verified.sms', userLanguage, {score: '{score}'})
      }
    };

    res.json({
      success: true,
      message: 'Notification templates retrieved successfully!',
      userLanguage,
      templates
    });

  } catch (error) {
    console.error('Templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get templates',
      error: error.message
    });
  }
});

module.exports = router;