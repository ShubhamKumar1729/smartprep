const mongoose = require("mongoose");

const userXPSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    totalXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserXP", userXPSchema);