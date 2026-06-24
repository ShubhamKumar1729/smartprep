const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },
    status: {
      type: String,
      enum: ["started", "submitted"],
      default: "started",
    },
    score: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    wrongAnswers: { type: Number, default: 0 },
    skippedAnswers: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

attemptSchema.index({ userId: 1, testId: 1 });
attemptSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Attempt", attemptSchema);