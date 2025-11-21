import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import postRoutes from "./routes/postRoutes.js";
import cropCircleRoutes from "./routes/cropCircleRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";

import path from "path";


dotenv.config();
const app = express();

// Connect MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Serve uploads folder
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/crop-circle", cropCircleRoutes);

app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

// Test route
app.get("/", (req, res) => res.send("🌾 Crop Circles Backend Running Smoothly"));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
