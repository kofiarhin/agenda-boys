// server/services/scraperService.js
const { PlaywrightCrawler } = require("crawlee");

const runScraper = async () => {
  const crawler = new PlaywrightCrawler({
    // Use headless mode to save resources on Render/Heroku
    launchContext: {
      launchOptions: { headless: true },
    },
    // Avoid memory leaks by limiting the crawl
    maxRequestsPerCrawl: 20,

    async requestHandler({ page, request, log }) {
      log.info(`Scraping: ${request.url}`);

      // Wait for the news container to ensure dynamic content is loaded
      await page.waitForSelector(".most-recent-list, .article-item", {
        timeout: 10000,
      });

      // Extract data in the browser context
      const articles = await page.$$eval(
        ".most-recent-list li, .article-item",
        (elements, category) => {
          return elements.map((el) => ({
            title: el.querySelector("h2, h3")?.innerText.trim(),
            link: el.querySelector("a")?.href,
            imageUrl: el.querySelector("img")?.src,
            category: category,
            source: "MyJoyOnline",
            createdAt: new Date(),
          }));
        },
        request.userData.category
      );
    },
  });

  // Run for specific categories to populate your "5-Minute Read"
  await crawler.run([
    {
      url: "https://www.myjoyonline.com/news/",
      userData: { category: "Politics" },
    },
    {
      url: "https://www.myjoyonline.com/business/",
      userData: { category: "Business" },
    },
  ]);
};

module.exports = { runScraper };
