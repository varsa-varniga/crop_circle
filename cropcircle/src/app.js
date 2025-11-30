import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import connectDB from "./config/db.js";
import postRoutes from "./routes/postRoutes.js";
import cropCircleRoutes from "./routes/cropCircleRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import satelliteRoutes from './routes/satelliteRoutes.js';
import sprouterRoutes from "./routes/sprouterRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import landRoutes from "./routes/landRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import farmProfileRoutes from "./routes/farmProfileRoutes.js";
import aggregatorRoutes from './routes/aggregatorRoutes.js';
import carbonRoutes from './routes/carbonRoutes.js';

import path from "path";

dotenv.config();
const app = express();

// Create uploads folder if it doesn't exist
const uploadsDir = path.join(path.resolve(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Uploads folder created');
}

// Connect MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Serve uploads folder
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

// Mount all routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/crop-circle", cropCircleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/sprouter", sprouterRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/lands", landRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/farm-profile", farmProfileRoutes);
app.use("/api/aggregator", aggregatorRoutes);
app.use("/api/carbon", carbonRoutes);
app.use("/api/satellite", satelliteRoutes);

// Test route
app.get("/", (req, res) => res.send("🌾 Crop Circles Backend Running Smoothly"));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);