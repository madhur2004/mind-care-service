import mongoose from "mongoose";

const meditationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  duration: { 
    type: Number, 
    required: true,
    min: 1
  },
  type: {
    type: String,
    enum: ["mindfulness", "breathing", "guided", "silent"],
    default: "mindfulness"
  },
  completedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Index for analytics
meditationSchema.index({ userId: 1, completedAt: -1 });

const Meditation = mongoose.model("Meditation", meditationSchema);

export default Meditation;