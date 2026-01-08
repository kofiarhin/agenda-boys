// server/services/myjoy/businessCrawler.js
const { createSectionCrawler } = require("./common");

const businessCrawler = async (opts = {}) => {
  const crawler = createSectionCrawler(
    {
      section: "BUSINESS",
      url: "https://www.myjoyonline.com/business/",
      listSelector: ".home-section-story-list.tt-center a[href]",
    },
    opts
  );

  await crawler.run();
};

module.exports = businessCrawler;
