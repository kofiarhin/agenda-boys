const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const News = require("./server/models/news.model");

const run = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    await News.deleteMany();

    const news = await News.find();
    console.log({ news });

    console.log({ news });
  } catch (error) {}
};

run();
