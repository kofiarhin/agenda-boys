// server/crawlers/myjoyonlineCrawler.js
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

const getMyJoyImage = async (page) => {
  const selector =
    ".container.article-body .img-holder img.article-thumb, img.article-thumb";

  try {
    await page.waitForSelector(selector, { timeout: 15000 });

    const url = await page.evaluate((sel) => {
      const img = document.querySelector(sel);
      if (!img) return null;

      const src =
        img.getAttribute("data-src") ||
        img.getAttribute("data-lazy-src") ||
        img.getAttribute("data-original") ||
        img.currentSrc ||
        img.getAttribute("src") ||
        null;

      if (!src) return null;
      if (src.startsWith("//")) return `https:${src}`;
      if (src.startsWith("/")) return `${location.origin}${src}`;
      return src;
    }, selector);

    return url || null;
  } catch {
    return null;
  }
};

const myjoyonlinecrawler = async () => {
  const crawler = new PlaywrightCrawler({
    launchContext: { launchOptions: { headless: true } },

    requestHandler: async ({ page, enqueueLinks, request, log }) => {
      if (request.label === "DETAIL") {
        log.info(`Scraping Article: ${request.url}`);

        try {
          await page.waitForSelector(".article-title", { timeout: 15000 });

          const rawTitle = await page
            .locator(".article-title")
            .first()
            .textContent();
          const rawText = await page
            .locator("#article-text")
            .first()
            .textContent();

          const title = normalizeSpace(rawTitle);
          const text = cleanArticleText(rawText);
          const image = await getMyJoyImage(page);

          if (!title || !text) {
            log.info(`⏭️ Skipped (missing content): ${request.url}`);
            return;
          }

          const exists = await News.exists({ url: request.url });
          if (exists) {
            log.info(`⏭️ Skipped (exists): ${request.url}`);
            return;
          }

          await News.create({
            source: "myjoyonline",
            url: request.url,
            title,
            text,
            image: image || null,
            timestamp: new Date(),
          });

          log.info(`✅ Saved: ${title}`);
        } catch (error) {
          if (error && error.code === 11000) {
            log.info(`⏭️ Skipped (exists): ${request.url}`);
            return;
          }
          log.error(`❌ Failed to process ${request.url}: ${error.message}`);
        }

        return;
      }

      // LIST/HOME page: enqueue more links
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

    // ✅ YOU HIT THIS LIMIT IN YOUR SCREENSHOT — BUMP IT
    maxRequestsPerCrawl: 500,

    // optional (helps throughput)
    maxConcurrency: 5,
  });

  await crawler.run([{ url: "https://www.myjoyonline.com", label: "HOME" }]);
};

module.exports = myjoyonlinecrawler;
