const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Middleware to verify admin JWT token
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No admin token provided'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'agrovihan_super_secret_key_2025_secure_123'
    );

    const admin = await Admin.findById(decoded.id);
    
    if (!admin || !admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin not found or inactive'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired admin token',
      error: error.message
    });
  }
};

// Middleware to check admin permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin || !req.admin.permissions || !req.admin.permissions[permission]) {
      return res.status(403).json({
        success: false,
        message: `Permission denied: ${permission} required`
      });
    }
    next();
  };
};

// Middleware to check admin role
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.admin || (req.admin.role !== role && req.admin.role !== 'super_admin')) {
      return res.status(403).json({
        success: false,
        message: `Role required: ${role}`
      });
    }
    next();
  };
};

module.exports = {
  authenticateAdmin,
  requirePermission,
  requireRole
};