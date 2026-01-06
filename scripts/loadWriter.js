// scripts/loadWriter.js
const path = require("path");
require("dotenv").config({ path: path.join(process.cwd(), ".env") });

const mongoose = require("mongoose");
const aiWriter = require("../server/ai/aiWriter/aiWriter");
const News = require("../server/models/news.model");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isRateLimit = (err) => {
  const msg = String(err?.message || "").toLowerCase();
  const code = err?.code;
  const status = err?.status;
  return code === 429 || status === 429 || msg.includes("rate_limit");
};

const isJsonValidateFailed = (err) => {
  const msg = String(err?.message || "").toLowerCase();
  const code = String(err?.code || "").toLowerCase();
  const status = err?.status;
  return (
    status === 400 &&
    (code.includes("json_validate_failed") ||
      msg.includes("json_validate_failed") ||
      msg.includes("max completion tokens") ||
      msg.includes("failed to generate json"))
  );
};

const jitter = (ms) => Math.floor(ms * (0.7 + Math.random() * 0.6)); // 70%–130%

const withRetry = async (fn) => {
  const RETRIES = 10;
  const BASE_DELAY_MS = 15000;
  const MAX_DELAY_MS = 180000;

  let attempt = 0;

  while (true) {
    try {
      return await fn(attempt + 1);
    } catch (err) {
      attempt += 1;

      const retryable = isRateLimit(err) || isJsonValidateFailed(err);
      if (!retryable || attempt > RETRIES) throw err;

      const exp = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** (attempt - 1));
      const wait = jitter(exp);

      // ✅ show waiting so you know it's alive
      console.log(`⏳ throttled. waiting ${Math.round(wait / 1000)}s...`);
      await sleep(wait);
    }
  }
};

const run = async () => {
  const MONGO = process.env.MONGO_URI || process.env.MONGO_URL;
  if (!MONGO) throw new Error("MONGO_URI (or MONGO_URL) missing in .env");
  if (!process.env.GROQ_API_KEY)
    throw new Error("GROQ_API_KEY missing in .env");

  // ✅ safe pacing
  const PER_ITEM_DELAY_MS = 35000;
  const COOLDOWN_MS = 120000;

  let extraDelayMs = 0;
  let streak429 = 0;

  try {
    await mongoose.connect(MONGO);
    console.log("✅ connected");

    const docs = await News.find({
      $or: [
        { rewrittenText: { $exists: false } },
        { rewrittenText: null },
        { rewrittenText: "" },
      ],
    }).select("_id title text");

    console.log(`🧾 to rewrite: ${docs.length}`);
    if (!docs.length) return;

    let updated = 0;
    let failed = 0;

    for (let idx = 0; idx < docs.length; idx++) {
      const n = docs[idx];
      const pos = `${idx + 1}/${docs.length}`;

      console.log(`\n📝 processing ${pos}  id=${n._id}`);

      try {
        const rewritten = await withRetry((attempt) =>
          aiWriter({ title: n.title, text: n.text, attempt })
        );

        streak429 = 0;
        extraDelayMs = Math.max(0, extraDelayMs - 5000);

        const newTitle = String(rewritten?.title || "").trim();
        const newText = String(rewritten?.text || "").trim();
        const newSummary = String(rewritten?.summary || "").trim();

        if (!newTitle || !newText)
          throw new Error("aiWriter returned empty title/text");

        const update = {
          rewrittenTitle: newTitle,
          rewrittenText: newText,
          rewrittenSummary: newSummary || "",
          rewrittenAt: new Date(),
        };

        const r = await News.updateOne({ _id: n._id }, { $set: update });

        if (!r.modifiedCount) {
          console.log(`⚠️ not modified ${pos}  id=${n._id}`);
        } else {
          updated += 1;
          console.log(`✅ updated ${pos}  totalUpdated=${updated}`);
        }
      } catch (err) {
        failed += 1;

        if (isRateLimit(err)) {
          streak429 += 1;
          extraDelayMs = Math.min(180000, extraDelayMs + 30000);

          console.log(`⛔ rate limited ${pos}  id=${n._id}`);

          if (streak429 >= 2) {
            console.log(`🧊 cooldown ${Math.round(COOLDOWN_MS / 1000)}s...`);
            await sleep(COOLDOWN_MS);
            streak429 = 0;
          }
        } else {
          console.log(`❌ failed ${pos}  id=${n._id}: ${err.message}`);
        }
      }

      const wait = PER_ITEM_DELAY_MS + extraDelayMs;
      console.log(`⏱️ next in ${Math.round(wait / 1000)}s...`);
      await sleep(wait);
    }

    console.log(`\n🏁 done. updated=${updated} failed=${failed}`);
  } catch (err) {
    console.log(err.message);
  } finally {
    await mongoose.disconnect();
    console.log("👋 disconnected");
  }
};

run();
