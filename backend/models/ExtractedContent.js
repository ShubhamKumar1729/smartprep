const mongoose = require("mongoose");

const extractedContentSchema = new mongoose.Schema(
  {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      required: true,
    },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    extractedText: { type: String, default: "" },
    cleanedText: { type: String, default: "" },
    keywords: [String],
    topics: [{ title: String, content: String }],
    headings: [String],
    definitions: [{ term: String, definition: String }],
    wordCount: { type: Number, default: 0 },
    sentences: { type: Number, default: 0 },
    processingStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

extractedContentSchema.index({ fileId: 1 });
extractedContentSchema.index({ userId: 1 });

module.exports = mongoose.model("ExtractedContent", extractedContentSchema);