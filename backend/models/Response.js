const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    selectedAnswer: { type: String, default: "" },
    isCorrect: { type: Boolean, default: false },
    isSkipped: { type: Boolean, default: false },
    isMarkedForReview: { type: Boolean, default: false },
  },
  { timestamps: true }
);

responseSchema.index({ attemptId: 1 });
responseSchema.index({ attemptId: 1, questionId: 1 });

module.exports = mongoose.model("Response", responseSchema);