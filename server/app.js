const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { getAuth, clerkMiddleware } = require("@clerk/express");

const summaryRoutes = require("./routes/summaryRoutes");
const newsRoutes = require("./routes/newsRoutes");
const commentRoutes = require("./routes/commentRoutes");
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes"); // ✅ add

const app = express();

app.use(clerkMiddleware());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

app.use(express.json());

app.get("/", (req, res) => res.json({ message: "welcome to agenda boys" }));

app.get("/api/me", async (req, res) => {
  const auth = getAuth(req);
  return res.json({ userId: auth?.userId || null });
});

app.use("/api/summary", summaryRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/news", commentRoutes);

app.use("/api/auth", authRoutes);

// ✅ posts
app.use("/api/posts", postRoutes);

app.get("/api/health", (req, res) => res.json({ message: "ok" }));

module.exports = app;
