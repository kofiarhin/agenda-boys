// server/services/myjoy/nationalCrawler.js
const { createSectionCrawler } = require("./common");

const nationalCrawler = async (opts = {}) => {
  const crawler = createSectionCrawler(
    {
      section: "NATIONAL",
      url: "https://www.myjoyonline.com/news/national/",
      listSelector: "div.img-holder a.bgposition.general-height[href]",
    },
    opts
  );

  await crawler.run();
};

module.exports = nationalCrawler;
