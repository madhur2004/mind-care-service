import express from "express";
import authenticateToken from "../middleware/auth.js";
import Mood from "../models/Mood.js";

const router = express.Router();

// Get all moods for user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const moods = await Mood.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(moods);
  } catch (error) {
    console.error("Get moods error:", error);
    res.status(500).json({ error: "Failed to fetch moods" });
  }
});

// Create new mood
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { mood, emoji, notes, intensity, tags } = req.body;

    if (!mood || !emoji) {
      return res.status(400).json({ error: "Mood and emoji are required" });
    }

    const newMood = new Mood({
      userId: req.user.id,
      mood,
      emoji,
      notes,
      intensity: intensity || 5,
      tags: tags || []
    });

    await newMood.save();
    res.status(201).json(newMood);
  } catch (error) {
    console.error("Create mood error:", error);
    res.status(500).json({ error: "Failed to create mood" });
  }
});

// Get mood statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const stats = await Mood.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: "$mood",
          count: { $sum: 1 },
          lastDate: { $max: "$date" }
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    console.error("Mood stats error:", error);
    res.status(500).json({ error: "Failed to fetch mood statistics" });
  }
});

export default router;