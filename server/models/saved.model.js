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
    tag: {
      type: String,
      trim: true,
      default: "",
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    readAt: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },
  },
  { timestamps: true }
);

SavedSchema.index({ clerkId: 1, newsId: 1 }, { unique: true });
SavedSchema.index({ clerkId: 1, createdAt: -1 });

module.exports = mongoose.model("Saved", SavedSchema);
