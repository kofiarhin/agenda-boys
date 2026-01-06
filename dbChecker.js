const dotenv = require("dotenv").config();
const News = require("./server/models/news.model");
const mongoose = require("mongoose");
const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("connected!!");

    const news = await News.find();
    news.forEach((n) => {
      if (n.summmary) {
        console.log(n);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

run();
