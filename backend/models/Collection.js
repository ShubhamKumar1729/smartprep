const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

collectionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Collection", collectionSchema);