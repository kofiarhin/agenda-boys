const threeNewsCrawler = require("./server/crawlers/threeNewsCrawler");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const myJoyOnline = require("./server/services/myjoyCrawler");
const News = require("./server/models/news.model");

const startCrawling = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await News.deleteMany();
    myJoyOnline();
  } catch (error) {
    console.log(error.message);
  }
};

startCrawling();
