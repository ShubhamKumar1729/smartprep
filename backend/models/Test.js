const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      required: true,
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      required: true,
    },
    testType: {
      type: String,
      enum: ["mcq", "viva", "mixed", "custom", "truefalse",
             "fillinblanks", "shortanswer"],
      default: "mcq",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "mixed"],
      default: "mixed",
    },
    duration: { type: Number, required: true, default: 30 },
    questionCount: { type: Number, required: true },
    questionTypes: [String],
    isActive: { type: Boolean, default: true },
    totalAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

testSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Test", testSchema);