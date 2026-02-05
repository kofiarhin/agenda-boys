// /server/models/comment.model.js
const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    newsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "News",
      required: true,
      index: true,
    },

    clerkId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 500,
    },
    upvotes: {
      type: [String],
      default: [],
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

CommentSchema.index({ newsId: 1, createdAt: -1 });

module.exports = mongoose.model("Comment", CommentSchema);
