// /server/controllers/commentController.js
const mongoose = require("mongoose");
const { getAuth } = require("@clerk/express");
const Comment = require("../models/comment.model");
const User = require("../models/user.model");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const buildUserMap = async (comments) => {
  const clerkIds = [...new Set(comments.map((c) => c.clerkId).filter(Boolean))];
  if (!clerkIds.length) return {};

  const users = await User.find({ clerkId: { $in: clerkIds } })
    .select("clerkId firstName lastName imageUrl")
    .lean();

  const map = {};
  for (const u of users) {
    map[u.clerkId] = {
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      imageUrl: u.imageUrl || "",
    };
  }
  return map;
};

const shapeComments = async (comments) => {
  const userMap = await buildUserMap(comments);

  return comments.map((c) => ({
    _id: c._id,
    newsId: c.newsId,
    clerkId: c.clerkId,
    text: c.text,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    user: userMap[c.clerkId] || { firstName: "", lastName: "", imageUrl: "" },
  }));
};

// GET /api/news/:newsId/comments
const getCommentsByNewsId = async (req, res) => {
  try {
    const { newsId } = req.params;
    const limit = Math.min(parseInt(req.query.limit || "30", 10), 100);

    if (!isValidObjectId(newsId)) {
      return res.status(400).json({ message: "Invalid newsId" });
    }

    const comments = await Comment.find({ newsId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const items = await shapeComments(comments);

    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch comments" });
  }
};

// POST /api/news/:newsId/comments
const addComment = async (req, res) => {
  try {
    const { newsId } = req.params;
    const text = String(req.body?.text || "").trim();

    if (!isValidObjectId(newsId)) {
      return res.status(400).json({ message: "Invalid newsId" });
    }

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    if (text.length > 500) {
      return res.status(400).json({ message: "Comment too long (max 500)" });
    }

    const auth = getAuth(req);
    const clerkId = auth?.userId || null;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId }).select("_id").lean();

    const created = await Comment.create({
      newsId,
      clerkId,
      userId: user?._id || null,
      text,
    });

    const shaped = (await shapeComments([created.toObject()]))[0];

    return res.status(201).json({ item: shaped });
  } catch (err) {
    return res.status(500).json({ message: "Failed to add comment" });
  }
};

// DELETE /api/news/:newsId/comments/:commentId
const deleteComment = async (req, res) => {
  try {
    const { newsId, commentId } = req.params;

    if (!isValidObjectId(newsId)) {
      return res.status(400).json({ message: "Invalid newsId" });
    }

    if (!isValidObjectId(commentId)) {
      return res.status(400).json({ message: "Invalid commentId" });
    }

    const auth = getAuth(req);
    const clerkId = auth?.userId || null;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const comment = await Comment.findOne({ _id: commentId, newsId }).lean();

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.clerkId !== clerkId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await Comment.deleteOne({ _id: commentId, newsId });

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete comment" });
  }
};

module.exports = {
  getCommentsByNewsId,
  addComment,
  deleteComment,
};
