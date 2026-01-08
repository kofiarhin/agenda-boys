// server/crawlers/myjoy/nationalCrawler.js
const { createSectionCrawler } = require("./common");

const nationalCrawler = (opts = {}) => {
  const { run } = createSectionCrawler(
    {
      section: "NATIONAL",
      url: "https://www.myjoyonline.com/news/national/",
      listSelector: "div.img-holder a.bgposition.general-height[href]",
    },
    opts
  );

  return run();
};

module.exports = nationalCrawler;
