// server/crawlers/crawler.js
const mongoose = require("mongoose");
require("dotenv").config();
const myJoyOnline = require("./myjoyCrawler");

const runCrawler = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  try {
    const result = await myJoyOnline();
    console.log("myjoyonline result:", result);

    if ((result.saved || 0) <= 0) throw new Error("No new docs saved.");
  } catch (err) {
    console.error("Crawler failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

runCrawler();
