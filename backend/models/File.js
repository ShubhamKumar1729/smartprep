const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    filePath: { type: String, required: true },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

fileSchema.index({ userId: 1, uploadedAt: -1 });
fileSchema.index({ collectionId: 1 });

module.exports = mongoose.model("File", fileSchema);