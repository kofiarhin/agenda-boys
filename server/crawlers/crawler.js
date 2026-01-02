const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const graphicCrawler = require("./garphic.crawler");
const citiNewsCrawler = require("./citiNewsCrawler");
const myJoyOnline = require("./myjoy.crawler");
const News = require("../models/news.model");

const runCrawler = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await News.deleteMany();
  await citiNewsCrawler();
  await myJoyOnline();
};

runCrawler();
