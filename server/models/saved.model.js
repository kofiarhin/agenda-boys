const mongoose = require("mongoose");

const SavedSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, index: true }, // Clerk userId
    newsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "News",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

SavedSchema.index({ clerkId: 1, newsId: 1 }, { unique: true });
SavedSchema.index({ clerkId: 1, createdAt: -1 });

module.exports = mongoose.model("Saved", SavedSchema);
