// scripts/generate-news-summaries.js
const path = require("path");
require("dotenv").config({ path: path.join(process.cwd(), ".env") });

const mongoose = require("mongoose");
const News = require("../server/models/news.model");
const summaryGenerator = require("../server/ai/summaryGenerator");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isRateLimit = (err) => {
  const msg = String(err?.message || "");
  const code = err?.code;
  const status = err?.status;
  return code === 429 || status === 429 || msg.includes("rate_limit");
};

const withRetry429 = async (fn, { retries = 8, baseDelayMs = 6000 } = {}) => {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (!isRateLimit(err) || attempt > retries) throw err;

      const wait = baseDelayMs * attempt; // linear backoff
      console.log(`⏳ 429 hit. waiting ${Math.round(wait / 1000)}s...`);
      await sleep(wait);
    }
  }
};

/**
 * Rate limit strategy (safe for Groq free-tier TPM bursts):
 * - Run sequentially (no Promise.all)
 * - Process in small batches (default 2)
 * - Enforce a fixed per-item delay so TPM budget resets each minute
 * - Retry on 429 with backoff and continue
 *
 * Env knobs:
 *  - SUMMARY_BATCH_SIZE=2
 *  - SUMMARY_PER_ITEM_DELAY_MS=12000
 *  - SUMMARY_BATCH_PAUSE_MS=15000
 *  - SUMMARY_RETRIES=8
 *  - SUMMARY_RETRY_BASE_DELAY_MS=6000
 */
const run = async () => {
  const MONGO = process.env.MONGO_URI || process.env.MONGO_URL;

  const BATCH_SIZE = Number(process.env.SUMMARY_BATCH_SIZE || 2);
  const PER_ITEM_DELAY_MS = Number(
    process.env.SUMMARY_PER_ITEM_DELAY_MS || 12000
  ); // spacing
  const BATCH_PAUSE_MS = Number(process.env.SUMMARY_BATCH_PAUSE_MS || 15000); // extra minute safety
  const RETRIES = Number(process.env.SUMMARY_RETRIES || 8);
  const RETRY_BASE_DELAY_MS = Number(
    process.env.SUMMARY_RETRY_BASE_DELAY_MS || 6000
  );

  try {
    if (!MONGO) throw new Error("MONGO_URI (or MONGO_URL) missing in .env");
    if (!process.env.GROQ_API_KEY)
      throw new Error("GROQ_API_KEY missing in .env");

    await mongoose.connect(MONGO);
    console.log("✅ connected");

    const docs = await News.find({
      $or: [
        { summary: { $exists: false } },
        { summary: null },
        { summary: "" },
      ],
    }).select("_id title text summary");

    console.log(`🧾 to summarize: ${docs.length}`);
    if (!docs.length) return;

    let updated = 0;
    let failed = 0;

    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = docs.slice(i, i + BATCH_SIZE);
      console.log(
        `\n📦 batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
          docs.length / BATCH_SIZE
        )} (${batch.length} items)`
      );

      for (const n of batch) {
        try {
          const summary = await withRetry429(
            () => summaryGenerator({ title: n.title, text: n.text }),
            { retries: RETRIES, baseDelayMs: RETRY_BASE_DELAY_MS }
          );

          const r = await News.updateOne({ _id: n._id }, { $set: { summary } });

          if (!r.modifiedCount) {
            console.log(`⚠️ not modified: ${n._id}`);
          } else {
            updated += 1;
            console.log(`✅ updated ${updated}/${docs.length}`);
          }
        } catch (err) {
          failed += 1;
          console.log(`❌ failed ${n._id}: ${err.message}`);
        }

        // per-item spacing to keep TPM under control
        await sleep(PER_ITEM_DELAY_MS);
      }

      // extra pause between batches (prevents "per minute" bans)
      if (i + BATCH_SIZE < docs.length) {
        console.log(`🛑 batch pause ${Math.round(BATCH_PAUSE_MS / 1000)}s...`);
        await sleep(BATCH_PAUSE_MS);
      }
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
