const { Router } = require("express");
const router = Router();
const News = require("../models/news.model");

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

router.get("/", async (req, res, next) => {
  try {
    const pageRaw = parseInt(req.query.page, 10);
    const limitRaw = parseInt(req.query.limit, 10);

    const page = Number.isNaN(pageRaw) ? 1 : Math.max(pageRaw, 1);
    const limit = Number.isNaN(limitRaw) ? 12 : clamp(limitRaw, 1, 50);

    const category = String(req.query.category || "")
      .trim()
      .toLowerCase();

    const filter = {};
    if (category && category !== "all") {
      // if you store lowercase categories in DB, keep it strict:
      filter.category = category;

      // if your DB has mixed case categories, use this instead:
      // filter.category = new RegExp(`^${category}$`, "i");
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
