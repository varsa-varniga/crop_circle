const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Admin name is required'],
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
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['super_admin', 'scheme_manager', 'application_manager'],
    default: 'application_manager'
  },
  permissions: {
    canManageUsers: { type: Boolean, default: false },
    canManageSchemes: { type: Boolean, default: false },
    canManageApplications: { type: Boolean, default: true },
    canManageAdmins: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
adminSchema.index({ email: 1 });
adminSchema.index({ role: 1 });

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;