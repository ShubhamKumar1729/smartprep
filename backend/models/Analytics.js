const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    averageScore: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    lowestScore: { type: Number, default: 0 },
    totalTestsTaken: { type: Number, default: 0 },
    averageAccuracy: { type: Number, default: 0 },
    averageTimeTaken: { type: Number, default: 0 },
    weakTopics: [{ topic: String, accuracy: Number }],
    strongTopics: [{ topic: String, accuracy: Number }],
    topicPerformance: [
      { topic: String, accuracy: Number, total: Number, correct: Number },
    ],
    readinessScore: { type: Number, default: 0 },
    readinessStatus: {
      type: String,
      enum: ["poor", "average", "good", "excellent"],
      default: "average",
    },
    lastCalculatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Analytics", analyticsSchema);