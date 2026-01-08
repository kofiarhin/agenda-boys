// server/crawlers/myjoy/politicsCrawler.js
const { createSectionCrawler } = require("./common");

const politicsCrawler = (opts = {}) => {
  const { run } = createSectionCrawler(
    {
      section: "POLITICS",
      url: "https://www.myjoyonline.com/news/politics/",
      listSelector: ".home-section-story-list.text-center a[href]",
    },
    opts
  );

  return run();
};

module.exports = politicsCrawler;
