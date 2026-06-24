const mongoose = require("mongoose");

const testQuestionSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    order: { type: Number, required: true },
  },
  { timestamps: true }
);

testQuestionSchema.index({ testId: 1, order: 1 });

module.exports = mongoose.model("TestQuestion", testQuestionSchema);