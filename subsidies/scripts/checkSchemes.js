// scripts/checkSchemes.js
const mongoose = require('mongoose');
require('dotenv').config();

const Scheme = require('../models/Scheme');

const checkSchemes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/agrovihan');
    console.log('✅ Connected to MongoDB');

    const schemes = await Scheme.find({});
    console.log(`📊 Total schemes in database: ${schemes.length}`);
    
    schemes.forEach((scheme, index) => {
      console.log(`${index + 1}. ${scheme.name} - Active: ${scheme.isActive}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking schemes:', error);
    process.exit(1);
  }
};

checkSchemes();