import express from "express";
import authenticateToken from "../middleware/auth.js";
import Meditation from "../models/Meditation.js";

const router = express.Router();

// Start meditation session
router.post("/start", authenticateToken, async (req, res) => {
  try {
    const { duration, type } = req.body;

    if (!duration) {
      return res.status(400).json({ error: "Duration is required" });
    }

    const meditation = new Meditation({
      userId: req.user.id,
      duration,
      type: type || "mindfulness"
    });

    await meditation.save();
    res.status(201).json(meditation);
  } catch (error) {
    console.error("Start meditation error:", error);
    res.status(500).json({ error: "Failed to record meditation" });
  }
});

// Get meditation history
router.get("/", authenticateToken, async (req, res) => {
  try {
    const meditations = await Meditation.find({ userId: req.user.id }).sort({ completedAt: -1 });
    res.json(meditations);
  } catch (error) {
    console.error("Get meditations error:", error);
    res.status(500).json({ error: "Failed to fetch meditations" });
  }
});

// Get meditation statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const stats = await Meditation.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalTime: { $sum: "$duration" },
          avgDuration: { $avg: "$duration" }
        }
      }
    ]);

    const weeklyStats = await Meditation.aggregate([
      { 
        $match: { 
          userId: req.user._id,
          completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        } 
      },
      {
        $group: {
          _id: { $dayOfWeek: "$completedAt" },
          dailyTotal: { $sum: "$duration" },
          sessionCount: { $sum: 1 }
        }
      }
    ]);

    res.json({
      ...stats[0],
      weeklyStats
    });
  } catch (error) {
    console.error("Meditation stats error:", error);
    res.status(500).json({ error: "Failed to fetch meditation statistics" });
  }
});





export default router;


