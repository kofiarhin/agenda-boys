// /server/models/news.model.js
const mongoose = require("mongoose");

const normalizeCategory = (v) =>
  String(v || "")
    .trim()
    .toLowerCase();

const NewsSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    rewrittenTitle: { type: String, trim: true },

    text: { type: String, trim: true },
    rewrittenText: { type: String, trim: true },

    summary: { type: String, trim: true },
    rewrittenSummary: { type: String, trim: true },

    url: { type: String, trim: true, index: true, sparse: true },
    source: { type: String, trim: true, index: true, sparse: true },

    image: { type: String, trim: true },

    category: {
      type: String,
      trim: true,
      set: normalizeCategory,
      index: true,
      default: "national",
      enum: [
        "national",
        "politics",
        "business",
        "sports",
        "tech",
        "world",
        "health",
        "entertainment",
      ],
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

NewsSchema.index({ timestamp: -1 });
NewsSchema.index({ category: 1, timestamp: -1 });

module.exports = mongoose.model("News", NewsSchema);
