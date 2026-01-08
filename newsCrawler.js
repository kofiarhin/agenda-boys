require("dotenv").config();

const myjoyCrawler = require("./server/crawlers/myjoy");
const mongoose = require("mongoose");
const News = require("./server/models/news.model");

const run = async () => {
  try {
    // optional but recommended while testing (prevents resuming old queues)
    process.env.CRAWLEE_PURGE_ON_START = "1";

    await mongoose.connect(process.env.MONGO_URI);

    await News.deleteMany({});

    await myjoyCrawler();
  } catch (error) {
    console.log(error.message);
  } finally {
    await mongoose.disconnect(); // ✅ clean exit
  }
};

run();
