import mongoose from "mongoose";

const journalSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 10000
  },
  mood: {
    type: String,
    enum: ["happy", "sad", "anxious", "angry", "tired", "excited", "calm", "stressed", "neutral"]
  },
  tags: [String],
  isPrivate: {
    type: Boolean,
    default: true
  },
  wordCount: Number
}, {
  timestamps: true
});

// Calculate word count before saving
journalSchema.pre('save', function(next) {
  this.wordCount = this.content.split(/\s+/).filter(word => word.length > 0).length;
  next();
});

// Index for better performance
journalSchema.index({ userId: 1, createdAt: -1 });

const Journal = mongoose.model("Journal", journalSchema);

export default Journal;