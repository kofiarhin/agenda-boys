const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();
const connectDB = require("./config/db");
const News = require("./models/news.model");
const summaryRoutes = require("./routes/summaryRoutes");

const app = express();
connectDB();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  return res.json({ message: "welcome  to agenda boys" });
});

app.use("/api/summary", summaryRoutes);

app.get("/api/news", async (req, res, next) => {
  try {
    const news = await News.find().sort({ timestamp: -1 }); // latest first
    return res.json(news);
  } catch (err) {
    next(err);
  }
});

app.get("/api/health", (req, res) => {
  return res.json({ message: "ok" });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
