require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agrovihan');
    console.log('📊 Connected to MongoDB');

    // Check if super admin already exists
    const existingAdmin = await Admin.findOne({ email: 'superadmin@agrovihan.com' });
    
    if (existingAdmin) {
      console.log('✅ Super Admin already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create super admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const superAdmin = await Admin.create({
      name: 'AgroVihan Super Admin',
      email: 'superadmin@agrovihan.com',
      password: hashedPassword,
      role: 'super_admin',
      permissions: {
        canManageUsers: true,
        canManageSchemes: true,
        canManageApplications: true,
        canManageAdmins: true
      }
    });

    console.log('🎉 SUPER ADMIN CREATED SUCCESSFULLY!');
    console.log('📧 Email: superadmin@agrovihan.com');
    console.log('🔑 Password: admin123');
    console.log('👑 Role: Super Admin');
    console.log('⚠️  Remember to change the password after first login!');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();