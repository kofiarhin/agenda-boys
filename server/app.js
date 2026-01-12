const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { getAuth } = require("@clerk/express");

const { clerkMiddleware } = require("@clerk/express");

const summaryRoutes = require("./routes/summaryRoutes");
const newsRoutes = require("./routes/newsRoutes");
// const authRoutes = require("./routes/authRoutes"); // remove if using Clerk

const app = express();

// Clerk (must be before routes)
app.use(clerkMiddleware());

// CORS (use env)
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

// user profile
app.get("/api/me", async (req, res, next) => {
  const auth = getAuth(req);

  const userId = auth.userId;

  return res.json({ userId });
});

// app.use("/api/auth", authRoutes);

app.use("/api/summary", summaryRoutes);
app.use("/api/news", newsRoutes);

app.get("/api/health", (req, res) => res.json({ message: "ok" }));

module.exports = app;
