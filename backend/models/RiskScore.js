const mongoose = require("mongoose");

const riskScoreSchema = new mongoose.Schema(
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
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: true,
      unique: true,
    },
    riskScore: { type: Number, default: 0 },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    eventCounts: {
      face_missing: { type: Number, default: 0 },
      multiple_faces: { type: Number, default: 0 },
      tab_switch: { type: Number, default: 0 },
      window_blur: { type: Number, default: 0 },
      fullscreen_exit: { type: Number, default: 0 },
      excessive_audio: { type: Number, default: 0 },
      page_reload: { type: Number, default: 0 },
    },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RiskScore", riskScoreSchema);