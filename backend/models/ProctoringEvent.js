const mongoose = require("mongoose");

const proctoringEventSchema = new mongoose.Schema(
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
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        "proctoring_started", "proctoring_ended",
        "face_present", "face_missing", "multiple_faces",
        "tab_switch", "window_blur", "fullscreen_exit",
        "page_reload", "camera_permission_denied",
        "microphone_permission_denied", "camera_started",
        "camera_stopped", "microphone_started", "microphone_stopped",
        "silence_detected", "voice_activity", "excessive_audio",
        "screenshot_captured", "face_detection_unavailable",
      ],
    },
    severity: {
      type: String,
      enum: ["info", "low", "medium", "high"],
      default: "info",
    },
    riskDelta: { type: Number, default: 0 },
    metadata: { type: Object, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

proctoringEventSchema.index({ attemptId: 1, createdAt: 1 });
proctoringEventSchema.index({ userId: 1 });

module.exports = mongoose.model("ProctoringEvent", proctoringEventSchema);