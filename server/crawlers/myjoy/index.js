// server/crawlers/myjoy/index.js
const nationalCrawler = require("./nationalCrawler");
const businessCrawler = require("./businessCrawler");
const politicsCrawler = require("./politicsCrawler");
const sportsCrawler = require("./sportsCrawler");

const runners = {
  national: nationalCrawler,
  sports: sportsCrawler,
  politics: politicsCrawler,
  business: businessCrawler,
};

const myJoyCrawler = async (opts = {}) => {
  console.log("[myjoy] runners:", Object.keys(runners));

  for (const [key, fn] of Object.entries(runners)) {
    console.log(`\n[myjoy] START ${key}`);
    try {
      await Promise.resolve(fn(opts));
      console.log(`[myjoy] DONE  ${key}`);
    } catch (err) {
      console.error(`[myjoy] FAIL  ${key}:`, err?.message || err);
    }
  }
};

module.exports = myJoyCrawler;
