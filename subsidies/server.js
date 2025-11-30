const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const ocrRoutes = require('./routes/ocr');
const notificationRoutes = require('./routes/notifications');
const adminAuthRoutes = require('./routes/adminAuth');
const adminRoutes = require('./routes/admin');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/agrovihan', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Import models
const User = require('./models/User');
const Scheme = require('./models/Scheme');

// Import routes
const authRoutes = require('./routes/auth');
const schemeRoutes = require('./routes/schemes');
const userRoutes = require('./routes/users');
const applicationRoutes = require('./routes/applications');

console.log('✅ Routes loaded:', {
  auth: typeof authRoutes,
  schemes: typeof schemeRoutes,
  users: typeof userRoutes,
  applications: typeof applicationRoutes,
  ocr: typeof ocrRoutes,
  notifications: typeof notificationRoutes,  // Add this
});

// Basic health check route
app.get('/', (req, res) => {
  const language = req.query.lang || 'ta';
  res.json({
    success: true,
    message: '🌾 AgroVihan Financial Empowerment Center API',
    version: '1.0.0',
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    language: language
  });
});

// Test route to check if server is working
app.get('/api/health', (req, res) => {
  const { getString, getLanguageFromRequest } = require('./utils/languageHelper');
  const language = req.query.lang || 'ta';
  
  res.json({
    success: true,
    message: getString('server.health', language),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    language: language
  });
});

// Test route to check models
app.get('/api/test/models', async (req, res) => {
  const { getString } = require('./utils/languageHelper');
  const language = req.query.lang || 'ta';
  
  try {
    const userCount = await User.countDocuments();
    const schemeCount = await Scheme.countDocuments();
    
    res.json({
      success: true,
      message: 'Models are working correctly ✅',
      models: {
        User: {
          loaded: true,
          count: userCount,
          modelName: User.modelName
        },
        Scheme: {
          loaded: true,
          count: schemeCount,
          modelName: Scheme.modelName
        }
      },
      language: language
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getString('server.error', language),
      error: error.message
    });
  }
});

// API Routes - Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/notifications', notificationRoutes);

// Admin routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  const { getString } = require('./utils/languageHelper');
  const language = req.query.lang || 'ta';
  
  res.status(500).json({
    success: false,
    message: getString('server.error', language),
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Handle 404 - Route not found
app.use((req, res) => {
  const { getString } = require('./utils/languageHelper');
  const language = req.query.lang || 'ta';
  
  res.status(404).json({
    success: false,
    message: getString('route.not_found', language),
    path: req.path,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'GET /api/test/models',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /api/schemes',
      'POST /api/schemes',
      'POST /api/schemes/recommend',
      'GET /api/schemes/check-eligibility/:schemeId',
      'GET /api/schemes/:id',
      'PUT /api/schemes/:id',
      'DELETE /api/schemes/:id',
      'GET /api/users/profile',
      'PUT /api/users/profile',
      'POST /api/users/profile/documents',
      'PUT /api/users/profile/kyc',
      'GET /api/users/stats',
      'POST /api/applications',
      'GET /api/applications',
      'GET /api/applications/:id',
      'GET /api/applications/track/:applicationId',
       'POST /api/ocr/process-document',
  'POST /api/ocr/process-multiple', 
  'POST /api/ocr/auto-fill-profile',
  'POST /api/notifications/test',
  'POST /api/notifications/send',
  'GET /api/notifications/test-service',
    ],
    language: language
  });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🌾 AgroVihan Financial Empowerment Center API            ║
╚════════════════════════════════════════════════════════════╝

🚀 Server running on port ${PORT}
📍 Access at: http://localhost:${PORT}
🌐 Multi-language Support: Tamil & English

📊 Available Routes:
   
   ✅ General Routes:
   - GET  http://localhost:${PORT}/
   - GET  http://localhost:${PORT}/api/health
   - GET  http://localhost:${PORT}/api/test/models
   
   👤 Authentication Routes:
   - POST http://localhost:${PORT}/api/auth/register
   - POST http://localhost:${PORT}/api/auth/login
   - GET  http://localhost:${PORT}/api/auth/me
   
   👥 User Profile Routes:
   - GET  http://localhost:${PORT}/api/users/profile
   - PUT  http://localhost:${PORT}/api/users/profile
   - POST http://localhost:${PORT}/api/users/profile/documents
   - PUT  http://localhost:${PORT}/api/users/profile/kyc
   - GET  http://localhost:${PORT}/api/users/stats
   
   💰 Scheme Routes:
   - GET  http://localhost:${PORT}/api/schemes
   - POST http://localhost:${PORT}/api/schemes
   - POST http://localhost:${PORT}/api/schemes/recommend
   - GET  http://localhost:${PORT}/api/schemes/:id
   - GET  http://localhost:${PORT}/api/schemes/check-eligibility/:id
   
   📝 Application Routes:
   - POST http://localhost:${PORT}/api/applications
   - GET  http://localhost:${PORT}/api/applications
   - GET  http://localhost:${PORT}/api/applications/:id
   - GET  http://localhost:${PORT}/api/applications/track/:applicationId

   🔍 OCR Routes:
   - POST http://localhost:${PORT}/api/ocr/process-document
   - POST http://localhost:${PORT}/api/ocr/process-multiple
   - POST http://localhost:${PORT}/api/ocr/auto-fill-profile
   
`);
});

module.exports = app;