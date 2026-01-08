// server/services/myjoy/myJoyCrawler.js
const nationalCrawler = require("./nationalCrawler");
const businessCrawler = require("./businessCrawler");
const politicsCrawler = require("./politicsCrawler");
const sportsCrawler = require("./sportsCrawler");

const runners = {
  sports: sportsCrawler,
  politics: politicsCrawler,
  business: businessCrawler,
  national: nationalCrawler,
};

const myJoyCrawler = async (opts = {}) => {
  // runs ONLY what is in runners
  for (const [key, fn] of Object.entries(runners)) {
    try {
      await fn(opts);
    } catch (err) {
      console.error(`[${key}] failed:`, err.message || err);
    }
  }
};

module.exports = myJoyCrawler;
