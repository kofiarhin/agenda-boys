// server/services/myjoy/sportsCrawler.js
const { createSectionCrawler } = require("./common");

const sportsCrawler = async (opts = {}) => {
  const crawler = createSectionCrawler(
    {
      section: "SPORTS",
      url: "https://www.myjoyonline.com/sports/",
      listSelector: ".home-section-story-list.tt-center a[href]",
    },
    opts
  );

  await crawler.run();
};

module.exports = sportsCrawler;
