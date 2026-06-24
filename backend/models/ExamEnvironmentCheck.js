const mongoose = require("mongoose");

const examEnvironmentCheckSchema = new mongoose.Schema(
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
    },
    cameraStatus: {
      type: String,
      enum: ["passed", "failed", "pending"],
      default: "pending",
    },
    microphoneStatus: {
      type: String,
      enum: ["passed", "failed", "pending"],
      default: "pending",
    },
    faceStatus: {
      type: String,
      enum: ["passed", "failed", "pending"],
      default: "pending",
    },
    singleFaceStatus: {
      type: String,
      enum: ["passed", "failed", "pending"],
      default: "pending",
    },
    fullscreenStatus: {
      type: String,
      enum: ["passed", "failed", "pending"],
      default: "pending",
    },
    permissionStatus: {
      type: String,
      enum: ["passed", "failed", "pending"],
      default: "pending",
    },
    allPassed: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExamEnvironmentCheck", examEnvironmentCheckSchema);