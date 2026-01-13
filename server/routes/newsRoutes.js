const { Router } = require("express");
const router = Router();

const News = require("../models/news.model");
const Saved = require("../models/saved.model");
const requireClerkAuth = require("../middleware/requireClerkAuth");

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

router.get("/", async (req, res, next) => {
  try {
    const pageRaw = parseInt(req.query.page, 10);
    const limitRaw = parseInt(req.query.limit, 10);

    const page = Number.isNaN(pageRaw) ? 1 : Math.max(pageRaw, 1);
    const limit = Number.isNaN(limitRaw) ? 12 : clamp(limitRaw, 1, 50);

    const category = String(req.query.category || "")
      .trim()
      .toLowerCase();

    const q = String(req.query.q || "").trim();

    const filter = {};
    if (category && category !== "all") filter.category = category;

    if (q) {
      const safe = escapeRegex(q);
      const rx = new RegExp(safe, "i");

      filter.$or = [
        { title: rx },
        { headline: rx },
        { summary: rx },
        { description: rx },
        { content: rx },
        { author: rx },
        { source: rx },
        { category: rx },
      ];
    }

    const total = await News.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const safePage = Math.min(page, totalPages);

    const items = await News.find(filter)
      .sort({ timestamp: -1 })
      .skip((safePage - 1) * limit)
      .limit(limit);

    return res.json({
      items,
      meta: {
        page: safePage,
        limit,
        total,
        totalPages,
        hasPrev: safePage > 1,
        hasNext: safePage < totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
});

/* ✅ Saved routes MUST be above "/:id" */

/* ✅ LIST: all saved items for the signed-in user (populated with News) */
router.get("/saved-news", requireClerkAuth, async (req, res) => {
  try {
    const clerkId = req.userId;

    const saved = await Saved.find({ clerkId })
      .sort({ createdAt: -1 })
      .populate("newsId");

    return res.json(saved);
  } catch (error) {
    return res.status(500).json({ error: "internal server error" });
  }
});

/* ✅ CHECK: is this news saved by user? (returns doc or null) */
router.get("/saved-news/:newsId", requireClerkAuth, async (req, res) => {
  try {
    const clerkId = req.userId;
    const { newsId } = req.params;

    const savedNews = await Saved.findOne({ newsId, clerkId });
    return res.json(savedNews); // doc or null
  } catch (error) {
    return res.status(500).json({ error: "internal server error" });
  }
});

/* ✅ SAVE (idempotent) */
router.post("/saved-news/:newsId", requireClerkAuth, async (req, res) => {
  try {
    const clerkId = req.userId;
    const { newsId } = req.params;

    const savedItem = await Saved.findOneAndUpdate(
      { clerkId, newsId },
      { clerkId, newsId },
      { new: true, upsert: true }
    );

    return res.json(savedItem);
  } catch (error) {
    return res.status(500).json({ error: "internal server error" });
  }
});

/* ✅ REMOVE: unsave for this user */
router.delete("/saved-news/:newsId", requireClerkAuth, async (req, res) => {
  try {
    const clerkId = req.userId;
    const { newsId } = req.params;

    const removed = await Saved.findOneAndDelete({ clerkId, newsId });
    return res.json({ removed: !!removed });
  } catch (error) {
    return res.status(500).json({ error: "internal server error" });
  }
});

/* ✅ Keep this LAST so it doesn't swallow other routes */
router.get("/:id", async (req, res) => {
  res.set("Cache-Control", "no-store");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  try {
    const { id } = req.params;
    if (!id) throw new Error("Please provide an id");

    const newsItem = await News.findById(id);
    if (!newsItem) throw new Error("news item not found");

    return res.json(newsItem);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
