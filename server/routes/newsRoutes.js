const { Router } = require("express");
const router = Router();

const News = require("../models/news.model");
const Saved = require("../models/saved.model");
const User = require("../models/user.model");
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
      filter.$text = { $search: q };
    }

    const total = await News.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const safePage = Math.min(page, totalPages);

    const allowedFields = new Set([
      "_id",
      "title",
      "rewrittenTitle",
      "summary",
      "rewrittenSummary",
      "text",
      "rewrittenText",
      "url",
      "source",
      "image",
      "category",
      "timestamp",
      "createdAt",
      "updatedAt",
    ]);

    const fields = String(req.query.fields || "")
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean)
      .filter((f) => allowedFields.has(f));

    const select = fields.length ? Array.from(new Set(["_id", ...fields])) : [];

    const query = News.find(filter)
      .select(select.length ? select.join(" ") : undefined)
      .skip((safePage - 1) * limit)
      .limit(limit);

    if (q) {
      query.select({ score: { $meta: "textScore" } }).sort({
        score: { $meta: "textScore" },
        timestamp: -1,
      });
    } else {
      query.sort({ timestamp: -1 });
    }

    const items = await query.lean();

    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");

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

router.get("/suggestions", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ items: [] });

    const safe = escapeRegex(q);
    const rx = new RegExp(safe, "i");

    const items = await News.find({ title: rx })
      .select("title")
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    return res.json({
      items: items.map((item) => ({
        _id: item._id,
        title: item.title,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load suggestions" });
  }
});

router.get("/trending", async (req, res) => {
  try {
    const limitRaw = parseInt(req.query.limit, 10);
    const daysRaw = parseInt(req.query.days, 10);
    const limit = Number.isNaN(limitRaw) ? 10 : clamp(limitRaw, 1, 50);
    const days = Number.isNaN(daysRaw) ? 7 : clamp(daysRaw, 1, 30);

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const items = await News.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $lookup: {
          from: "saveds",
          localField: "_id",
          foreignField: "newsId",
          as: "savedItems",
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "newsId",
          as: "commentItems",
        },
      },
      {
        $addFields: {
          saveCount: { $size: "$savedItems" },
          commentCount: { $size: "$commentItems" },
          score: {
            $add: [{ $multiply: [{ $size: "$savedItems" }, 2] }, { $size: "$commentItems" }],
          },
        },
      },
      { $sort: { score: -1, timestamp: -1 } },
      { $limit: limit },
      {
        $project: {
          savedItems: 0,
          commentItems: 0,
        },
      },
    ]);

    return res.json({ items, meta: { limit, days } });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load trending" });
  }
});

router.get("/personalized", requireClerkAuth, async (req, res) => {
  try {
    const clerkId = req.userId;
    const pageRaw = parseInt(req.query.page, 10);
    const limitRaw = parseInt(req.query.limit, 10);

    const page = Number.isNaN(pageRaw) ? 1 : Math.max(pageRaw, 1);
    const limit = Number.isNaN(limitRaw) ? 12 : clamp(limitRaw, 1, 50);

    const user = await User.findOne({ clerkId })
      .select("preferredCategories preferredSources keywords")
      .lean();

    const preferredCategories = user?.preferredCategories || [];
    const preferredSources = user?.preferredSources || [];
    const keywords = user?.keywords || [];

    const filter = {};
    if (preferredCategories.length) {
      filter.category = { $in: preferredCategories };
    }

    if (preferredSources.length) {
      filter.source = { $in: preferredSources };
    }

    if (keywords.length) {
      filter.$text = { $search: keywords.join(" ") };
    }

    const total = await News.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const safePage = Math.min(page, totalPages);

    const items = await News.find(filter)
      .sort({ timestamp: -1 })
      .skip((safePage - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      items,
      meta: {
        page: safePage,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load personalized feed" });
  }
});

router.get("/most-discussed", async (req, res) => {
  try {
    const limitRaw = parseInt(req.query.limit, 10);
    const daysRaw = parseInt(req.query.days, 10);
    const limit = Number.isNaN(limitRaw) ? 10 : clamp(limitRaw, 1, 50);
    const days = Number.isNaN(daysRaw) ? 7 : clamp(daysRaw, 1, 30);

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const items = await News.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "newsId",
          as: "commentItems",
        },
      },
      {
        $addFields: {
          commentCount: { $size: "$commentItems" },
        },
      },
      { $sort: { commentCount: -1, timestamp: -1 } },
      { $limit: limit },
      { $project: { commentItems: 0 } },
    ]);

    return res.json({ items, meta: { limit, days } });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load most discussed" });
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

/* ✅ UPDATE: update tag, note, priority, readAt */
router.patch("/saved-news/:newsId", requireClerkAuth, async (req, res) => {
  try {
    const clerkId = req.userId;
    const { newsId } = req.params;

    const tag = String(req.body?.tag || "").trim();
    const note = String(req.body?.note || "").trim();
    const priority = ["low", "normal", "high"].includes(req.body?.priority)
      ? req.body.priority
      : "normal";
    const readAt = req.body?.readAt ? new Date(req.body.readAt) : null;

    const updated = await Saved.findOneAndUpdate(
      { clerkId, newsId },
      { $set: { tag, note, priority, readAt } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Saved item not found" });
    }

    return res.json(updated);
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
