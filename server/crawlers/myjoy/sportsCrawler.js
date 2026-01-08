// server/crawlers/myjoy/sportsCrawler.js
const { createSectionCrawler } = require("./common");

const sportsCrawler = (opts = {}) => {
  const { run } = createSectionCrawler(
    {
      section: "SPORTS",
      url: "https://www.myjoyonline.com/sports/",
      listSelector: ".home-section-story-list.tt-center a[href]",
    },
    opts
  );

  return run();
};

module.exports = sportsCrawler;
