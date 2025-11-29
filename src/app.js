import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import postRoutes from "./routes/postRoutes.js";
import cropCircleRoutes from "./routes/cropCircleRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import sprouterRoutes from "./routes/sprouterRoutes.js";  // VERY IMPORTANT
import checkoutRoutes from "./routes/checkoutRoutes.js";
import landRoutes from "./routes/landRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import farmProfileRoutes from "./routes/farmProfileRoutes.js"; // Add Farm Profile




import path from "path";




dotenv.config();
const app = express();


// Connect MongoDB
connectDB();
app.use(express.json());
// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));


// Serve uploads folder
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

// Mount routes
app.use("/api/sprouter", sprouterRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/lands", landRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/farm-profile", farmProfileRoutes); // Add Farm Profile routes




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
