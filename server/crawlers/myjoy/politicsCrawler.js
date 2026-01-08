// server/services/myjoy/politicsCrawler.js
const { createSectionCrawler } = require("./common");

const politicsCrawler = async (opts = {}) => {
  const crawler = createSectionCrawler(
    {
      section: "POLITICS",
      url: "https://www.myjoyonline.com/news/politics/",
      listSelector: ".home-section-story-list.text-center a[href]",
    },
    opts
  );

  await crawler.run();
};

module.exports = politicsCrawler;
