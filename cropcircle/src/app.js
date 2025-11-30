import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";  // Remove "src/" from here
import postRoutes from "./routes/postRoutes.js";
import cropCircleRoutes from "./routes/cropCircleRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import landRoutes from "./routes/landRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import sprouterRoutes from "./routes/sprouterRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import satelliteRoutes from './routes/satelliteRoutes.js';

import path from "path";
import fs from "fs";

dotenv.config();
const app = express();

import carbonRoutes from './routes/carbonRoutes.js';
// Create uploads folder if it doesn't exist
const uploadsDir = path.join(path.resolve(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Uploads folder created');
}

// Connect MongoDB
connectDB();
app.use(express.json());
// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/notifications", notificationRoutes);





// Serve static files (uploaded images/documents)
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

// API Routes - All systems integrated
app.use("/api/auth", authRoutes);
app.use("/api/crop-circle", cropCircleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/lands", landRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/sprouters", sprouterRoutes);
app.use("/api/carbon", carbonRoutes);
app.use("/api/satellite", satelliteRoutes);

// Root route with all endpoints
app.get("/", (req, res) => {
  res.json({ 
    message: '🌾 AgroVihan - Complete Farming Platform API',
    version: '2.0.0',
    status: 'Running',
    timestamp: new Date().toISOString(),
    services: [
      'User Authentication & Profiles',
      'Crop Circle Community',
      'Knowledge Sharing Posts', 
      'Sprouter Registration System',
      'Land Leasing Marketplace',
      'E-commerce Checkout System'
    ],
    endpoints: {
      // Authentication & Users
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      getUser: 'GET /api/users/profile',
      updateUser: 'PUT /api/users/profile',

      // Crop Circle (Community)
      createPost: 'POST /api/crop-circle/posts',
      getAllPosts: 'GET /api/crop-circle/posts',
      getPostById: 'GET /api/crop-circle/posts/:id',
      likePost: 'PUT /api/crop-circle/posts/:id/like',
      commentPost: 'PUT /api/crop-circle/posts/:id/comment',

      // Posts (Knowledge Sharing)
      createKnowledgePost: 'POST /api/posts',
      getAllKnowledgePosts: 'GET /api/posts',
      getKnowledgePostById: 'GET /api/posts/:id',

      // 🌱 SPRROUTER REGISTRATION SYSTEM
      createSprouter: 'POST /api/sprouters/profile',
      getSprouter: 'GET /api/sprouters/profile?phone=PHONE',
      updateSprouter: 'PUT /api/sprouters/profile?phone=PHONE',
      getAllSprouters: 'GET /api/sprouters/all',
      sprouterFileUpload: 'POST /api/sprouters/upload',

      // Land Leasing System
      createLand: 'POST /api/lands',
      getAllLands: 'GET /api/lands',
      getLandById: 'GET /api/lands/:id',
      updateLand: 'PUT /api/lands/:id',
      deleteLand: 'DELETE /api/lands/:id',
      approveLand: 'PUT /api/lands/:id/approve',

      // E-commerce Checkout System
      createOrder: 'POST /api/checkout',
      getAllOrders: 'GET /api/checkout',
      getOrderById: 'GET /api/checkout/:orderId',
      updateOrderStatus: 'PUT /api/checkout/:orderId/status',
      getUserOrders: 'GET /api/checkout/user/:userId',
      getOrderStats: 'GET /api/checkout/stats/summary'
    }
  });
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ 
    success: true, 
    message: '🌱 AgroVihan Server is running smoothly', 
    timestamp: new Date().toISOString(),
    database: 'MongoDB Connected',
    services: [
      'User Authentication',
      'Crop Circle Community', 
      'Knowledge Posts',
      'Sprouter Registration',
      'Land Leasing System',
      'E-commerce Checkout'
    ],
    status: 'All Systems Operational ✅'
  });
});

// Test Sprouter Route
app.get("/api/test-sprouter", (req, res) => {
  res.json({
    success: true,
    message: "🌱 Sprouter routes are working!",
    endpoints: {
      createProfile: "POST /api/sprouters/profile",
      getProfile: "GET /api/sprouters/profile?phone=YOUR_PHONE",
      updateProfile: "PUT /api/sprouters/profile?phone=YOUR_PHONE",
      getAll: "GET /api/sprouters/all",
      uploadFile: "POST /api/sprouters/upload"
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🌾 AgroVihan - Complete Farming Platform                   ║
║  ✅ Server: http://localhost:${PORT}                         ║
║  📊 Status: Running                                         ║
║  🗄️  Database: MongoDB Connected                            ║
║  📁 Structure: src/ directory organized                     ║
║  🌱 Services Integrated:                                    ║
║     • User Authentication                                   ║
║     • Crop Circle Community                                 ║
║     • Knowledge Sharing Posts                               ║
║     • 🌱 Sprouter Registration System                       ║
║     • Land Leasing System                                   ║
║     • E-commerce Checkout                                   ║
║  🎯 Frontend: http://localhost:5173                         ║
║  📍 Test: http://localhost:${PORT}/api/test-sprouter         ║
╚══════════════════════════════════════════════════════════════╝
  `);
});