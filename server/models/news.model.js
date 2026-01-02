// server/models/news.model.js
const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: true,
      trim: true,
      enum: ["myjoyonline", "graphic", "citinews", "peacefmonline"], // add/remove as you like
      index: true,
    },
    url: {
      type: String,
      required: true,
      unique: true, // keep this if urls will never clash across sources
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { versionKey: false }
);

module.exports = mongoose.model("News", newsSchema);
