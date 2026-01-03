const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();
const connectDB = require("./config/db");
const News = require("./models/news.model");
const summaryRoutes = require("./routes/summaryRoutes");
const newsRoutes = require("./routes/newsRoutes");

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
app.use("/api/news", newsRoutes);

app.get("/api/health", (req, res) => {
  return res.json({ message: "ok" });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
