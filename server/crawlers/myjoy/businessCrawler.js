// server/crawlers/myjoy/businessCrawler.js
const { createSectionCrawler } = require("./common");

const businessCrawler = (opts = {}) => {
  const { run } = createSectionCrawler(
    {
      section: "BUSINESS",
      url: "https://www.myjoyonline.com/business/",
      listSelector: ".home-section-story-list.tt-center a[href]",
    },
    opts
  );

  return run();
};

module.exports = businessCrawler;
