const express = require('express');
const router = express.Router();
const { authenticateAdmin, requirePermission, requireRole } = require('../middleware/adminAuth');
const User = require('../models/User');
const Scheme = require('../models/Scheme');
const Application = require('../models/Application');
const Admin = require('../models/Admin');

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    // Get total counts
    const totalUsers = await User.countDocuments();
    const totalSchemes = await Scheme.countDocuments();
    const totalApplications = await Application.countDocuments();
    
    // Get application status counts
    const applicationStatus = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent applications
    const recentApplications = await Application.find()
      .populate('user', 'name email phone')
      .populate('scheme', 'name benefit')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get user registration trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const userRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      message: 'Admin dashboard data retrieved successfully! 📊',
      statistics: {
        users: {
          total: totalUsers,
          recent: userRegistrations.reduce((sum, day) => sum + day.count, 0)
        },
        schemes: {
          total: totalSchemes,
          active: await Scheme.countDocuments({ isActive: true })
        },
        applications: {
          total: totalApplications,
          byStatus: applicationStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        }
      },
      recentApplications: recentApplications.map(app => ({
        id: app._id,
        applicationId: app.applicationId,
        user: app.user,
        scheme: app.scheme,
        status: app.status,
        submittedAt: app.submittedAt,
        processingTime: app.getProcessingTime()
      })),
      trends: {
        userRegistrations
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// @route   GET /api/admin/applications
// @desc    Get all applications with filtering
// @access  Private (Admin with application management permission)
router.get('/applications', authenticateAdmin, requirePermission('canManageApplications'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, scheme, district, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (district) filter['applicantData.address.district'] = district;

    // Build populate for scheme filter
    let populateQuery = [
      { path: 'user', select: 'name email phone language' },
      { path: 'scheme', select: 'name nameInTamil category benefit' }
    ];

    if (scheme) {
      filter.scheme = scheme;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get applications with pagination
    const applications = await Application.find(filter)
      .populate(populateQuery)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Application.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      message: 'Applications retrieved successfully! 📋',
      applications: applications.map(app => ({
        id: app._id,
        applicationId: app.applicationId,
        user: app.user,
        scheme: app.scheme,
        status: app.status,
        statusInTamil: app.getStatusInTamil(),
        submittedAt: app.submittedAt,
        reviewedAt: app.reviewedAt,
        approvedAt: app.approvedAt,
        processingTime: app.getProcessingTime(),
        applicantData: app.applicantData
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        status: await Application.distinct('status'),
        districts: await Application.distinct('applicantData.address.district'),
        schemes: await Scheme.find({ isActive: true }).select('name _id')
      }
    });

  } catch (error) {
    console.error('Admin applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/applications/:id/status
// @desc    Update application status
// @access  Private (Admin with application management permission)
router.put('/applications/:id/status', authenticateAdmin, requirePermission('canManageApplications'), async (req, res) => {
  try {
    const { status, reviewComments, rejectionReason, assignedOfficer } = req.body;
    const applicationId = req.params.id;

    console.log('🔧 DEBUG - Status Update Request:', {
      applicationId,
      status,
      reviewComments,
      rejectionReason,
      assignedOfficer
    });

    // Validate status
    const validStatuses = ['submitted', 'under_review', 'approved', 'rejected', 'disbursed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find application
    const application = await Application.findById(applicationId)
      .populate('user')
      .populate('scheme');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    console.log('🔧 DEBUG - Found Application:', {
      id: application._id,
      applicationId: application.applicationId,
      currentStatus: application.status
    });

    // Prepare update data
    const updateData = { status };
    const timelineUpdate = {};

    switch (status) {
      case 'under_review':
        timelineUpdate.reviewedAt = new Date();
        break;
      case 'approved':
        timelineUpdate.approvedAt = new Date();
        break;
      case 'rejected':
        timelineUpdate.rejectedAt = new Date();
        break;
      case 'disbursed':
        timelineUpdate.disbursedAt = new Date();
        break;
    }

    if (reviewComments) updateData.reviewComments = reviewComments;
    if (rejectionReason) updateData.rejectionReason = rejectionReason;
    if (assignedOfficer) updateData.assignedOfficer = assignedOfficer;

    console.log('🔧 DEBUG - Update Data:', { ...updateData, ...timelineUpdate });

    // Update application
    const updatedApplication = await Application.findByIdAndUpdate(
      applicationId,
      { ...updateData, ...timelineUpdate },
      { new: true, runValidators: true }
    ).populate('user').populate('scheme');

    console.log('🔧 DEBUG - Application Updated Successfully:', {
      newStatus: updatedApplication.status,
      applicationId: updatedApplication.applicationId
    });

    // Send notification to user (wrap in try-catch to avoid breaking the main flow)
    try {
      const NotificationService = require('../services/notificationService');
      await NotificationService.sendNotification(application.user, {
        type: `application_${status}`,
        variables: {
          userName: application.user.name,
          schemeName: application.scheme.name,
          applicationId: application.applicationId,
          amount: application.scheme.benefitAmount || '0',
          nextSteps: 'Check your dashboard for details'
        }
      });
      console.log('🔧 DEBUG - Notification sent successfully');
    } catch (notificationError) {
      console.warn('⚠️ Notification failed (non-critical):', notificationError.message);
      // Don't throw error - notification failure shouldn't break status update
    }

    res.json({
      success: true,
      message: `Application status updated to ${status}! ✅`,
      application: {
        id: updatedApplication._id,
        applicationId: updatedApplication.applicationId,
        status: updatedApplication.status,
        statusInTamil: updatedApplication.getStatusInTamil(),
        reviewComments: updatedApplication.reviewComments,
        rejectionReason: updatedApplication.rejectionReason,
        assignedOfficer: updatedApplication.assignedOfficer,
        timeline: {
          submitted: updatedApplication.submittedAt,
          reviewed: updatedApplication.reviewedAt,
          approved: updatedApplication.approvedAt,
          rejected: updatedApplication.rejectedAt,
          disbursed: updatedApplication.disbursedAt
        }
      }
    });

  } catch (error) {
    console.error('❌ Update application status error:', error);
    
    // More specific error messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID format',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating application status',
      error: error.message
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with filtering
// @access  Private (Admin with user management permission)
router.get('/users', authenticateAdmin, requirePermission('canManageUsers'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, district, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build filter
    const filter = { isActive: true };
    if (role) filter.role = role;
    if (district) filter['financialProfile.district'] = district;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get users with pagination
    const users = await User.find(filter)
      .select('name email phone role language financialProfile createdAt lastLogin')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Format user data
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      language: user.language,
      district: user.financialProfile.district,
      landSize: user.financialProfile.landSize,
      annualIncome: user.financialProfile.annualIncome,
      eligibilityScore: user.calculateEligibilityScore(),
      profileComplete: user.isFinancialProfileComplete(),
      kycVerified: user.financialProfile.kycVerified,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }));

    res.json({
      success: true,
      message: 'Users retrieved successfully! 👥',
      users: formattedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        roles: await User.distinct('role'),
        districts: await User.distinct('financialProfile.district')
      }
    });

  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// @route   GET /api/admin/schemes
// @desc    Get all schemes with management options
// @access  Private (Admin with scheme management permission)
router.get('/schemes', authenticateAdmin, requirePermission('canManageSchemes'), async (req, res) => {
  try {
    const { page = 1, limit = 10, category, state, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build filter
    const filter = {};
    if (category) filter.category = category;
    if (state) filter['eligibility.applicableStates'] = state;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get schemes with pagination
    const schemes = await Scheme.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Scheme.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Get application statistics for each scheme
    const schemesWithStats = await Promise.all(
      schemes.map(async (scheme) => {
        const applicationStats = await Application.aggregate([
          { $match: { scheme: scheme._id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);

        const stats = applicationStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {});

        return {
          id: scheme._id,
          name: scheme.name,
          nameInTamil: scheme.nameInTamil,
          category: scheme.category,
          benefit: scheme.benefit,
          benefitAmount: scheme.benefitAmount,
          isActive: scheme.isActive,
          issuingAuthority: scheme.issuingAuthority,
          processingTime: scheme.processingTime,
          applicationStats: stats,
          totalApplications: Object.values(stats).reduce((sum, count) => sum + count, 0),
          createdAt: scheme.createdAt
        };
      })
    );

    res.json({
      success: true,
      message: 'Schemes retrieved successfully! 💰',
      schemes: schemesWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        categories: await Scheme.distinct('category'),
        states: await Scheme.distinct('eligibility.applicableStates'),
        authorities: await Scheme.distinct('issuingAuthority')
      }
    });

  } catch (error) {
    console.error('Admin schemes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching schemes',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/schemes/:id/status
// @desc    Toggle scheme active status
// @access  Private (Admin with scheme management permission)
router.put('/schemes/:id/status', authenticateAdmin, requirePermission('canManageSchemes'), async (req, res) => {
  try {
    const { isActive } = req.body;
    const schemeId = req.params.id;

    const scheme = await Scheme.findByIdAndUpdate(
      schemeId,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found'
      });
    }

    res.json({
      success: true,
      message: `Scheme ${isActive ? 'activated' : 'deactivated'} successfully! ${isActive ? '✅' : '⏸️'}`,
      scheme: {
        id: scheme._id,
        name: scheme.name,
        isActive: scheme.isActive
      }
    });

  } catch (error) {
    console.error('Toggle scheme status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating scheme status',
      error: error.message
    });
  }
});

module.exports = router;