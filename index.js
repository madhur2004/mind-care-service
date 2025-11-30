import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
//import { fileURLToPath } from "url";
// Load environment variables FIRST
dotenv.config();

console.log("🔑 Checking Gemini API Key in server.js:", process.env.GEMINI_API_KEY ? "✅ Present" : "❌ Missing");
console.log('📧 Email Config Check:', {
  user: process.env.EMAIL_USER ? '✅ Set' : '❌ Missing',
  password: process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Missing'
});
import { configureCloudinary } from "./utils/cloudinary.js";
configureCloudinary();



// THEN import routes
import authRoutes from "./routes/auth.js";
import moodRoutes from "./routes/moods.js";
import journalRoutes from "./routes/journals.js";
import chatRoutes from "./routes/chat.js";
import meditationRoutes from "./routes/meditation.js";
import progressRoutes from "./routes/progress.js";
import settingsRoutes from "./routes/settings.js";
import { startWeeklyReports } from "./utils/weeklyReports.js";
import profileRoutes from "./routes/profile.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Security Rate Limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

// Middleware
app.use(helmet());
app.use(limiter);
app.use(express.json({ limit: "10mb" }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Static files serve karne ke liye (uploads folder)
  app.use('/uploads', express.static('uploads'));

// Database Connection
const connectDB = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};


// Start Server After DB Connect
connectDB().then(() => {
  app.use("/api/auth", authRoutes);
  app.use("/api/moods", moodRoutes);
  app.use("/api/journals", journalRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/meditation", meditationRoutes);
  app.use("/api/progress", progressRoutes);
  app.use("/api/settings", settingsRoutes);

  

// Routes mein add karo
  app.use("/api/profile", profileRoutes);

    // Weekly reports scheduler start karo
  startWeeklyReports();
  console.log('✅ Weekly reports scheduler started');

  app.get("/api/health", (req, res) => {
    res.json({
      status: "Server is running",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
      geminiConfigured: !!process.env.GEMINI_API_KEY,
    });
  });

    app.get('/api/uploads-check', (req, res) => {
    res.json({
      message: 'Uploads directory is accessible',
      uploadsPath: path.join(__dirname, 'uploads'),
      files: [] // You can list files here if needed
    });
  });

  app.use("*", (req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  // Error Handler
  app.use((error, req, res, next) => {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔑 Gemini API Key Status: ${process.env.GEMINI_API_KEY ? "✅ Configured" : "❌ Missing"}`);
  });
});