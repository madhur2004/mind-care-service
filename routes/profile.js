import express from "express";
import authenticateToken from "../middleware/auth.js";
import User from "../models/User.js";
import multer from "multer";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const router = express.Router();

// Multer configuration - memory storage use karein
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Get user profile
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user profile (name and basic info)
router.put("/", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true }
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      user
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Upload profile picture to Cloudinary
router.post("/upload-avatar", authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    console.log('📤 Avatar upload request received');
    
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log('📁 File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Upload to Cloudinary
    console.log('☁️ Uploading to Cloudinary...');
    const result = await uploadToCloudinary(req.file.buffer, req.user.id);
    
    console.log('✅ Cloudinary upload successful:', result.secure_url);

    // Store Cloudinary URL in database
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { avatar: result.secure_url } },
      { new: true }
    ).select("-password");

    res.json({
      message: "Profile picture updated successfully",
      user,
      avatarUrl: result.secure_url
    });
  } catch (error) {
    console.error("❌ Avatar upload error:", error);
    res.status(500).json({ 
      error: "Failed to upload profile picture",
      details: error.message 
    });
  }
});

// Remove profile picture from Cloudinary
router.delete("/remove-avatar", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.avatar) {
      try {
        // Cloudinary se delete karein
        const publicId = `mental-health-app/avatars/avatar_${req.user.id}`;
        await deleteFromCloudinary(publicId);
        console.log('✅ Avatar removed from Cloudinary');
      } catch (cloudinaryError) {
        console.warn('⚠️ Could not delete from Cloudinary, but continuing...', cloudinaryError);
      }
    }

    // Database se remove karein
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { avatar: null } },
      { new: true }
    ).select("-password");

    res.json({
      message: "Profile picture removed successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("❌ Avatar remove error:", error);
    res.status(500).json({ 
      error: "Failed to remove profile picture",
      details: error.message 
    });
  }
});

export default router;