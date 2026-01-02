// server/crawlers/newsCrawler.js
const { PlaywrightCrawler } = require("crawlee");
const News = require("../models/news.model");

const normalizeSpace = (s) => (s ? s.replace(/\s+/g, " ").trim() : "");

const cleanArticleText = (s) => {
  if (!s) return "";
  return s
    .replace(/googletag\.cmd\.push\(.*?\);/gs, "")
    .replace(/\n\s*\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
};

const saveNewsIfNew = async ({ url, title, text, image }) => {
  const exists = await News.exists({ url });
  if (exists) return { saved: false };

  try {
    const doc = await News.create({
      url,
      title,
      text,
      image: image || null,
      timestamp: new Date(),
    });

    return { saved: true, doc };
  } catch (err) {
    // Race condition safety: if another request saved it first
    if (err && err.code === 11000) return { saved: false };
    throw err;
  }
};

const newsCrawler = async () => {
  const crawler = new PlaywrightCrawler({
    launchContext: {
      launchOptions: { headless: true },
    },

    requestHandler: async ({ page, enqueueLinks, request, log }) => {
      // DETAIL page: scrape and save only if it doesn't exist
      if (request.label === "DETAIL") {
        log.info(`Scraping Article: ${request.url}`);

        try {
          await page.waitForSelector(".article-title", { timeout: 15000 });

          const rawTitle = await page.locator(".article-title").textContent();
          const rawText = await page.locator("#article-text").textContent();

          const cleanTitle = normalizeSpace(rawTitle);
          const cleanText = cleanArticleText(rawText);

          const image = await page
            .locator(".article-thumb img")
            .getAttribute("src")
            .catch(() => null);

          // Basic validation: skip if critical fields missing
          if (!cleanTitle || !cleanText) {
            log.info(`⏭️ Skipped (missing content): ${request.url}`);
            return;
          }

          const result = await saveNewsIfNew({
            url: request.url,
            title: cleanTitle,
            text: cleanText,
            image,
            source: "myjoyonline",
          });

          if (result.saved) log.info(`✅ Saved: ${cleanTitle}`);
          else log.info(`⏭️ Skipped (exists): ${request.url}`);
        } catch (error) {
          log.error(`❌ Failed to process ${request.url}: ${error.message}`);
        }

        return;
      }

      // HOME page: enqueue article links
      try {
        const enqueued = await enqueueLinks({
          selector: ".home-post-list-title a",
          label: "DETAIL",
        });

        log.info(
          `Enqueued ${enqueued.processedRequests.length} links from homepage`
        );
      } catch (error) {
        log.error(`❌ Failed to enqueue links: ${error.message}`);
      }
    },

    navigationTimeoutSecs: 60,
    maxRequestsPerCrawl: 10,
  });

  await crawler.run(["https://www.myjoyonline.com"]);
};

module.exports = newsCrawler;
