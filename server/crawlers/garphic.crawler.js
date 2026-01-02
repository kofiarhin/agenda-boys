const { PlaywrightCrawler, enqueueLinks } = require("crawlee");

const graphicCrawler = async () => {
  const crawler = new PlaywrightCrawler({
    requestHandler: async ({ page, request, enqueueLinks }) => {
      const newElement = ".list-title a";

      if (request.label === "DETAILS") {
        console.log("grab data");
      }

      await page.waitForSelector(newElement);
      await enqueueLinks({
        selector: newElement,
        label: "DETAILS",
      });
    },
  });

  crawler.run(["https://www.graphic.com.gh/news.html"]);
};

module.exports = graphicCrawler;
