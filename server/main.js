// server/main.js
const mongoose = require("mongoose");
require("dotenv").config();

const myjoyCrawler = require("./services/myjoyCrawler");
const graphicCrawler = require("./services/graphic-crawler");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🚀 Connected to MongoDB");

    console.log("🕵️ Starting MyJoy crawler...");
    await myjoyCrawler();

    console.log("🕵️ Starting Graphic crawler...");
    await graphicCrawler();

    console.log("✅ All crawls completed");
  } catch (err) {
    console.error("❌ Error during crawl:", err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();
