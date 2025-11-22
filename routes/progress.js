import express from "express";
import authenticateToken from "../middleware/auth.js";

import Mood from "../models/Mood.js";
import Journal from "../models/Journal.js";
import Meditation from "../models/Meditation.js";
import mongoose from "mongoose";

const router = express.Router();

// ------------------------------------
// 🔹 Streak Calculation Function
// ------------------------------------
function calculateStreak(moods, moodDistribution) {
  if (!moods.length) return 0;

  let streak = 1;
  let bestStreak = 1;

  for (let i = 1; i < moods.length; i++) {
    const prevDate = new Date(moods[i - 1].createdAt);
    const currDate = new Date(moods[i].createdAt);

    const diffDays =
      Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
      bestStreak = Math.max(bestStreak, streak);
    } else if (diffDays > 1) {
      streak = 1;
    }
  }

  return bestStreak;
}

// ------------------------------------
// 🔹 GET Progress Stats
// ------------------------------------
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // ✔ Fetch mood logs
    const moods = await Mood.find({ userId }).sort({ createdAt: 1 });

    // ✔ Count moods
    const totalMoods = moods.length;

    // ✔ Journals count
    const totalJournals = await Journal.countDocuments({ userId });

    // ✔ Meditation time (sum of all durations)
    const meditations = await Meditation.find({ userId });
    const totalMeditationTime = meditations.reduce(
      (sum, m) => sum + (m.duration || 0),
      0
    );

    // ✔ Mood distribution
    const moodDistribution = await Mood.aggregate([
      { $match: { userId } },
      { $group: { _id: "$mood", count: { $sum: 1 } } },
    ]);

    // ✔ Convert to frontend format
    const formattedMoodData = moodDistribution.map((m) => ({
      mood: m._id,
      count: m.count,
    }));

    // ✔ Calculate best streak
    const streak = calculateStreak(moods, formattedMoodData);

    // ⬇ Final Response
    return res.status(200).json({
      totalMoods,
      totalJournals,
      totalMeditationTime,
      moodDistribution: formattedMoodData,
      streak,
    });

  } catch (error) {
    console.error("Progress stats error:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch progress stats" });
  }
});

export default router;
