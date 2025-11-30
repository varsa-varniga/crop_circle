// backend/scripts/checkUser.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agrovihan');
    console.log('📊 Connected to MongoDB');

    const email = 'negashree2203@gmail.com';
    const user = await User.findOne({ email }).select('+password');

    if (user) {
      console.log('✅ User found:');
      console.log('- Name:', user.name);
      console.log('- Email:', user.email);
      console.log('- Phone:', user.phone);
      console.log('- Has Password:', !!user.password);
      console.log('- District:', user.financialProfile?.district);
    } else {
      console.log('❌ User NOT found:', email);
      console.log('You need to register this user first!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkUser();