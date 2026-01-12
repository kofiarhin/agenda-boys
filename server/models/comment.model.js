// server/models/comment.model.js
const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    newsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "News",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    clerkId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },

    likesCount: { type: Number, default: 0, min: 0 },
    repliesCount: { type: Number, default: 0, min: 0 },

    isEdited: { type: Boolean, default: false },

    status: {
      type: String,
      default: "active",
      enum: ["active", "deleted", "hidden"],
      index: true,
    },
  },
  { timestamps: true }
);

CommentSchema.index({ newsId: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1, createdAt: 1 });
CommentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Comment", CommentSchema);
