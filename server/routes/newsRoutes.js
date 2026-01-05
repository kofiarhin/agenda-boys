const { Router } = require("express");
const router = Router();
const News = require("../models/news.model");

router.get("/", async (req, res, next) => {
  try {
    const news = await News.find().sort({ timestamp: -1 }); // latest first
    return res.json(news);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  try {
    const { id } = req.params;
    if (!id) {
      throw new Error("Please provfide an id");
    }
    const newsItem = await News.findById(id);
    if (!newsItem) {
      throw new Error("new item not found");
    }
    return res.json(newsItem);
  } catch (error) {
    return res.json({ error: error.message });
  }
});

module.exports = router;
