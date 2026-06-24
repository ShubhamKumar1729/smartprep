const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questionType: {
      type: String,
      enum: ["mcq", "truefalse", "fillinblanks", "shortanswer", "longanswer", "viva"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    question: { type: String, required: true },
    options: [String],
    answer: { type: String, required: true },
    explanation: { type: String, default: "" },
  },
  { timestamps: true }
);

questionSchema.index({ fileId: 1, questionType: 1 });
questionSchema.index({ userId: 1 });

module.exports = mongoose.model("Question", questionSchema);