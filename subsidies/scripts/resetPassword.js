require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const resetPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agrovihan');
    console.log('📊 Connected to MongoDB');

    const email = 'negashree2203@gmail.com';
    const newPassword = 'test123';

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    console.log('✅ Password reset successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 New Password:', newPassword);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
};

resetPassword();