import express from "express";
import authenticateToken from "../middleware/auth.js";
import Journal from "../models/Journal.js";

const router = express.Router();

// Get all journals for user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const journals = await Journal.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(journals);
  } catch (error) {
    console.error("Get journals error:", error);
    res.status(500).json({ error: "Failed to fetch journals" });
  }
});

// Create new journal
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, content, mood, tags, isPrivate } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const newJournal = new Journal({
      userId: req.user.id,
      title,
      content,
      mood: mood || "neutral",
      tags: tags || [],
      isPrivate: isPrivate !== undefined ? isPrivate : true
    });

    await newJournal.save();
    res.status(201).json(newJournal);
  } catch (error) {
    console.error("Create journal error:", error);
    res.status(500).json({ error: "Failed to create journal" });
  }
});

// Update journal
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { title, content, mood, tags, isPrivate } = req.body;
    
    const journal = await Journal.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!journal) {
      return res.status(404).json({ error: "Journal not found" });
    }

    journal.title = title || journal.title;
    journal.content = content || journal.content;
    journal.mood = mood || journal.mood;
    journal.tags = tags || journal.tags;
    journal.isPrivate = isPrivate !== undefined ? isPrivate : journal.isPrivate;

    await journal.save();
    res.json(journal);
  } catch (error) {
    console.error("Update journal error:", error);
    res.status(500).json({ error: "Failed to update journal" });
  }
});

// Delete journal
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const journal = await Journal.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!journal) {
      return res.status(404).json({ error: "Journal not found" });
    }

    res.json({ success: true, message: "Journal deleted successfully" });
  } catch (error) {
    console.error("Delete journal error:", error);
    res.status(500).json({ error: "Failed to delete journal" });
  }
});

// Get journal statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const stats = await Journal.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          totalJournals: { $sum: 1 },
          totalWords: { $sum: "$wordCount" },
          avgWords: { $avg: "$wordCount" }
        }
      }
    ]);

    res.json(stats[0] || { totalJournals: 0, totalWords: 0, avgWords: 0 });
  } catch (error) {
    console.error("Journal stats error:", error);
    res.status(500).json({ error: "Failed to fetch journal statistics" });
  }
});

export default router;