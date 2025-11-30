import express from "express";
import authenticateToken from "../middleware/auth.js";
import User from "../models/User.js";
import JournalEntry from "../models/Journal.js";
import MoodEntry from "../models/Mood.js";
import Meditation from "../models/Meditation.js";

const router = express.Router();

// Get user settings
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("settings");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // ✅ Default settings agar koi setting missing hai
    const defaultSettings = {
      notifications: true,
      emailUpdates: true,
      privacyMode: false,
      dataSaving: false,
      theme: "light",
      fontSize: "medium",
      fontStyle: "inter"
    };
    
    const userSettings = { ...defaultSettings, ...user.settings };
    res.json(userSettings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user settings
router.put("/", authenticateToken, async (req, res) => {
  try {
    const { 
      notifications, 
      emailUpdates, 
      privacyMode, 
      dataSaving, 
      theme, 
      fontSize, 
      fontStyle  // ✅ Added fontStyle
    } = req.body;

    const updateFields = {};
    if (notifications !== undefined) updateFields["settings.notifications"] = notifications;
    if (emailUpdates !== undefined) updateFields["settings.emailUpdates"] = emailUpdates;
    if (privacyMode !== undefined) updateFields["settings.privacyMode"] = privacyMode;
    if (dataSaving !== undefined) updateFields["settings.dataSaving"] = dataSaving;
    if (theme !== undefined) updateFields["settings.theme"] = theme;
    if (fontSize !== undefined) updateFields["settings.fontSize"] = fontSize;
    if (fontStyle !== undefined) updateFields["settings.fontStyle"] = fontStyle; // ✅ Added

    updateFields["settings.updatedAt"] = new Date();

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true }
    ).select("settings");

    // ✅ Return merged settings with defaults
    const defaultSettings = {
      notifications: true,
      emailUpdates: true,
      privacyMode: false,
      dataSaving: false,
      theme: "light",
      fontSize: "medium",
      fontStyle: "inter"
    };
    
    const userSettings = { ...defaultSettings, ...user.settings };
    res.json(userSettings);
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Export user data
router.get("/export-data", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [user, journals, moods, meditations] = await Promise.all([
      User.findById(userId),
      JournalEntry.find({ user: userId }),
      MoodEntry.find({ user: userId }),
      Meditation.find({ user: userId })
    ]);

    const exportData = {
      userInfo: {
        name: user.name,
        email: user.email,
        joinedAt: user.createdAt
      },
      settings: user.settings || {},
      journalEntries: journals,
      moodEntries: moods,
      meditationSessions: meditations,
      exportDate: new Date().toISOString(),
      totalEntries: {
        journals: journals.length,
        moodEntries: moods.length,
        meditationSessions: meditations.length
      }
    };

    // Set headers for file download
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=mental-wellness-data-${Date.now()}.json`);
    
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).json({ error: "Failed to export data" });
  }
});

// Delete user account
router.delete("/delete-account", authenticateToken, async (req, res) => {
  try {
    const { confirmation } = req.body;
    
    if (confirmation !== "DELETE_MY_ACCOUNT") {
      return res.status(400).json({ error: "Please type DELETE_MY_ACCOUNT to confirm" });
    }

    const userId = req.user.id;

    // Delete all user data
    await Promise.all([
      User.findByIdAndDelete(userId),
      JournalEntry.deleteMany({ user: userId }),
      MoodEntry.deleteMany({ user: userId }),
      Meditation.deleteMany({ user: userId })
    ]);

    res.json({ 
      message: "Account and all data deleted successfully",
      deletedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;