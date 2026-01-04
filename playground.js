const threeNewsCrawler = require("./server/crawlers/threeNewsCrawler");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();

const startCrawling = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await threeNewsCrawler();
  } catch (error) {
    console.log(error.message);
  }
};

startCrawling();
