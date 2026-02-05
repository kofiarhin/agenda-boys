// server/models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    email: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    imageUrl: { type: String, default: "" },
    preferredCategories: {
      type: [String],
      default: [],
    },
    preferredSources: {
      type: [String],
      default: [],
    },
    keywords: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
