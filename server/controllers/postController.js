// server/controllers/postController.js
const Post = require("../models/post.model");

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const getPosts = async (req, res) => {
  try {
    const pageRaw = parseInt(req.query.page, 10);
    const limitRaw = parseInt(req.query.limit, 10);

    const page = Number.isNaN(pageRaw) ? 1 : Math.max(pageRaw, 1);
    const limit = Number.isNaN(limitRaw) ? 20 : clamp(limitRaw, 1, 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Post.find({ status: "active" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments({ status: "active" }),
    ]);

    return res.json({
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch posts" });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const clerkId = req.auth?.userId;
    if (!clerkId) return res.status(401).json({ message: "Unauthorized" });

    const items = await Post.find({ clerkId, status: "active" })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch your posts" });
  }
};

const createPost = async (req, res) => {
  try {
    const clerkId = req.auth?.userId;
    if (!clerkId) return res.status(401).json({ message: "Unauthorized" });

    const content = (req.body.content || "").trim();
    if (!content)
      return res.status(400).json({ message: "content is required" });

    const imagesIncoming = Array.isArray(req.body.images)
      ? req.body.images
      : [];
    const images = imagesIncoming
      .map((u) => (typeof u === "string" ? u.trim() : ""))
      .filter(Boolean)
      .slice(0, 4);

    const post = await Post.create({
      clerkId,
      content,
      images,
      status: "active",
    });

    return res.status(201).json({ post });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create post" });
  }
};

const deletePost = async (req, res) => {
  try {
    const clerkId = req.auth?.userId;
    if (!clerkId) return res.status(401).json({ message: "Unauthorized" });

    const { postId } = req.params;

    const post = await Post.findOneAndUpdate(
      { _id: postId, clerkId, status: "active" },
      { status: "deleted" },
      { new: true }
    ).lean();

    if (!post) return res.status(404).json({ message: "Post not found" });

    return res.json({ message: "Post deleted", post });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete post" });
  }
};

module.exports = {
  getPosts,
  getUserPosts,
  createPost,
  deletePost,
};
