const { Router } = require("express");
const News = require("../models/news.model");
const summaryGenerator = require("../ai/summaryGenerator");

const router = Router();

router.get("/", async (req, res, next) => {
  const news = await News.find();
  const result = await summaryGenerator(news);
  return res.json(result);
});

module.exports = router;
