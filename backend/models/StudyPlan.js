const mongoose = require("mongoose");

const studyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    target: { type: String, default: "Upcoming Exam" },
    duration: { type: Number, default: 7 },
    hoursPerDay: { type: Number, default: 2 },
    topics: [{ topic: String, priority: String }],
    plan: [{ day: Number, title: String, topics: [String], tasks: [String] }],
    generatedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudyPlan", studyPlanSchema);