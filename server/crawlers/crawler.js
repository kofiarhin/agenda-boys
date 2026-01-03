const mongoose = require("mongoose");
require("dotenv").config();

const citiNewsCrawler = require("./citiNewsCrawler");
const myJoyOnline = require("./myjoy.crawler");
const News = require("../models/news.model");

const runCrawler = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const before = await News.countDocuments();

  try {
    await citiNewsCrawler();
    await myJoyOnline();

    const after = await News.countDocuments();
    const added = after - before;

    console.log("before:", before, "after:", after, "added:", added);

    if (added <= 0) throw new Error("No new docs saved.");
  } catch (err) {
    console.error("Crawler failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

runCrawler();
