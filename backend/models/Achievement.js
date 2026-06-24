const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    badge: { type: String, required: true },
    description: { type: String, default: "" },
    xp: { type: Number, default: 0 },
    earnedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

achievementSchema.index({ userId: 1, badge: 1 }, { unique: true });

module.exports = mongoose.model("Achievement", achievementSchema);