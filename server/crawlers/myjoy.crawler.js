const { PlaywrightCrawler, enqueueLinks } = require("crawlee");

const myJoyOnline = async () => {
  const crawler = new PlaywrightCrawler({
    requestHandler: async ({ page, request, enqueueLinks }) => {
      console.log("crawler started");
    },
  });

  crawler.run([
    { url: "https://www.myjoyonline.com/news/", label: "NEWS" },
    { url: "second url", label: "POLITICS" },
  ]);
};

module.exports = myJoyOnline;
