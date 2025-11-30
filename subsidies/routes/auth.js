const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getString } = require('../utils/languageHelper');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, district, language } = req.body;
    const userLanguage = language || 'ta';

    console.log('📝 Registration attempt:', { 
      name, 
      email, 
      phone: phone ? 'provided' : 'missing', 
      district: district ? 'provided' : 'missing',
      role 
    });

    // Validate required fields with better error messages
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { phone }] 
    });

    if (existingUser) {
      const message = existingUser.email === email.toLowerCase() 
        ? 'User with this email already exists. Please login instead.'
        : 'User with this phone number already exists.';
      
      console.log('❌ User already exists:', message);
      return res.status(400).json({
        success: false,
        message: message
      });
    }

    // Handle missing fields gracefully for auto-registration
    const userData = {
      name: name || 'Sprouter User',
      email: email.toLowerCase(),
      phone: phone || '+910000000000',
      password: password || 'default123',
      district: district || 'Unknown District',
      language: userLanguage,
      role: role || 'sprouter',
      financialProfile: {
        district: district || 'Unknown District',
        state: 'Tamil Nadu',
        landSize: 0,
        annualIncome: 0,
        crops: [],
        soilType: 'Unknown',
        waterAccess: 'Rainfed'
      }
    };

    // Hash password if provided, otherwise use default
    if (password && password !== 'default123') {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(password, salt);
    } else {
      // Hash the default password
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash('default123', salt);
    }

    console.log('✅ Creating user with data:', {
      name: userData.name,
      email: userData.email,
      district: userData.district,
      role: userData.role
    });

    // Create new user
    const user = await User.create(userData);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'agrovihan_super_secret_key_2025_secure_123',
      { expiresIn: '30d' }
    );

    console.log('✅ User registered successfully:', user.email);

    // Return user data (without password)
    res.status(201).json({
      success: true,
      message: 'User registered successfully! ✅',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        language: user.language,
        district: user.financialProfile.district,
        eligibilityScore: user.calculateEligibilityScore ? user.calculateEligibilityScore() : 0,
        profileComplete: user.isFinancialProfileComplete ? user.isFinancialProfileComplete() : false
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', { email });

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user (including password field)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✅ User found:', user.email);

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔑 Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'agrovihan_super_secret_key_2025_secure_123',
      { expiresIn: '30d' }
    );

    console.log('✅ Login successful for:', user.email);

    // Return user data (without password)
    res.json({
      success: true,
      message: 'Login successful! ✅',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        language: user.language,
        district: user.financialProfile?.district || 'Unknown',
        eligibilityScore: user.calculateEligibilityScore ? user.calculateEligibilityScore() : 0,
        profileComplete: user.isFinancialProfileComplete ? user.isFinancialProfileComplete() : false,
        farmTokens: user.farmTokens || 0,
        carbonCredits: user.carbonCredits || 0
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/auto-register
// @desc    Auto-register user from main app (for cross-system sync)
// @access  Public
router.post('/auto-register', async (req, res) => {
  try {
    const { name, email, phone, district, language, role } = req.body;

    console.log('🔄 Auto-registration attempt:', { name, email, district });

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required for auto-registration'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('✅ User already exists, generating token');
      
      // Generate token for existing user
      const token = jwt.sign(
        { 
          id: existingUser._id, 
          email: existingUser.email,
          role: existingUser.role 
        },
        process.env.JWT_SECRET || 'agrovihan_super_secret_key_2025_secure_123',
        { expiresIn: '30d' }
      );

      return res.json({
        success: true,
        message: 'Auto-login successful',
        token,
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          phone: existingUser.phone,
          role: existingUser.role,
          district: existingUser.financialProfile?.district
        },
        autoLoggedIn: true
      });
    }

    // Create user data for auto-registration
    const userData = {
      name,
      email: email.toLowerCase(),
      phone: phone || '+910000000000',
      password: await bcrypt.hash('default123', 10),
      district: district || 'Unknown District',
      language: language || 'ta',
      role: role || 'sprouter',
      financialProfile: {
        district: district || 'Unknown District',
        state: 'Tamil Nadu'
      },
      autoRegistered: true
    };

    console.log('✅ Creating auto-registered user:', userData.email);

    // Create new user
    const user = await User.create(userData);

    // Generate token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'agrovihan_super_secret_key_2025_secure_123',
      { expiresIn: '30d' }
    );

    console.log('✅ Auto-registration successful:', user.email);

    res.status(201).json({
      success: true,
      message: 'Auto-registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        district: user.financialProfile.district,
        autoRegistered: true
      }
    });

  } catch (error) {
    console.error('❌ Auto-registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Auto-registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged-in user
// @access  Private
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

    console.log('🔍 Verifying token for /me endpoint');

    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'agrovihan_super_secret_key_2025_secure_123'
    );

    // Get user data
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Token verified for user:', user.email);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        language: user.language,
        financialProfile: user.financialProfile || {},
        eligibilityScore: user.calculateEligibilityScore ? user.calculateEligibilityScore() : 0,
        profileComplete: user.isFinancialProfileComplete ? user.isFinancialProfileComplete() : false,
        farmTokens: user.farmTokens || 0,
        carbonCredits: user.carbonCredits || 0,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('❌ Auth error:', error.message);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.',
        clearToken: true
      });
    }

    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/check-email
// @desc    Check if email exists (for auto-registration flow)
// @access  Public
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    res.json({
      success: true,
      exists: !!user,
      user: user ? {
        id: user._id,
        name: user.name,
        email: user.email
      } : null
    });

  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// Auto-login route for main app users
router.post('/auto-login', async (req, res) => {
  try {
    const { email, name, phone, district, landSize } = req.body;

    // Find or create user in subsidies database
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Auto-register user
      user = new User({
        name: name || 'Sprouter User',
        email: email.toLowerCase(),
        phone: phone || '+910000000000',
        password: await bcrypt.hash('auto_generated_password', 10),
        role: 'sprouter',
        language: 'ta',
        autoRegistered: true,
        financialProfile: {
          district: district || 'Unknown District',
          state: 'Tamil Nadu',
          landSize: landSize || 0
        }
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'agrovihan_secret_key_2025',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Auto-login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        financialProfile: user.financialProfile
      }
    });

  } catch (error) {
    console.error('Auto-login error:', error);
    res.status(500).json({
      success: false,
      message: 'Auto-login failed',
      error: error.message
    });
  }
});
module.exports = router;