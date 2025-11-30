const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// @route   POST /api/admin/login
// @desc    Admin login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find admin (including password field)
    const admin = await Admin.findOne({ email, isActive: true }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin._id, 
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      },
      process.env.JWT_SECRET || 'agrovihan_secret_key_2025',
      { expiresIn: '24h' } // Shorter expiry for admin tokens
    );

    // Return admin data (without password)
    res.json({
      success: true,
      message: 'Admin login successful! 🔐',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during admin login',
      error: error.message
    });
  }
});

// @route   POST /api/admin/register
// @desc    Register new admin (Super Admin only)
// @access  Private (Super Admin)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, permissions } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new admin
    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'application_manager',
      permissions: permissions || {
        canManageUsers: false,
        canManageSchemes: false,
        canManageApplications: true,
        canManageAdmins: false
      }
    });

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully! 👨‍💼',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });

  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering admin',
      error: error.message
    });
  }
});

// @route   GET /api/admin/me
// @desc    Get current logged-in admin
// @access  Private (Admin)
router.get('/me', async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'agrovihan_secret_key_2025'
    );

    // Get admin data
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin,
        isActive: admin.isActive
      }
    });

  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
});

module.exports = router;