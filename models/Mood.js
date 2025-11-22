import mongoose from "mongoose";

const moodSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  mood: { 
    type: String, 
    required: true,
    enum: ["happy", "sad", "anxious", "angry", "tired", "excited", "calm", "stressed"]
  },
  emoji: {
    type: String,
    required: true
  },
  notes: { 
    type: String, 
    maxlength: 500 
  },
  intensity: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  tags: [String],
  date: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Index for faster queries
moodSchema.index({ userId: 1, date: -1 });

const Mood = mongoose.model("Mood", moodSchema);

export default Mood;