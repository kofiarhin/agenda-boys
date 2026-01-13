// server/models/post.model.js
const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
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
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 280,
    },

    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length <= 4,
        message: "A post can have at most 4 images.",
      },
    },

    status: {
      type: String,
      enum: ["active", "deleted"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

PostSchema.index({ clerkId: 1, createdAt: -1 });
PostSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Post", PostSchema);
