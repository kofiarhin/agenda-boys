// threeNewsCrawler.js
const { PlaywrightCrawler } = require("crawlee");
const News = require("../models/news.model");

const threeNewsCrawler = async () => {
  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 500,

    requestHandler: async ({ request, page, enqueueLinks, log }) => {
      await page.waitForLoadState("domcontentloaded");

      // LIST
      if (request.label === "LIST") {
        const articleSelector = 'a[href^="/news/"]:has(h2.font-semibold)';
        await page.waitForSelector(articleSelector, { timeout: 20000 });

        await enqueueLinks({
          selector: articleSelector,
          label: "DETAIL",
          strategy: "same-domain",
          transformRequestFunction: (req) => {
            const { pathname } = new URL(req.url);
            if (!/^\/news\/[^/]+$/.test(pathname)) return null;
            return req;
          },
        });

        return;
      }

      // DETAIL
      if (request.label === "DETAIL") {
        await page.waitForSelector("header h1", { timeout: 20000 });

        const title = (
          await page.locator("header h1").first().innerText()
        ).trim();
        const url = request.url;

        // HERO IMAGE
        const heroImg = page.locator("header + div.relative img").first();
        await heroImg.waitFor({ timeout: 20000 });

        const src = await heroImg.getAttribute("src");
        const srcset = await heroImg.getAttribute("srcset");

        const bestFromSrcset = (s) => {
          if (!s) return null;
          return s.split(",").pop().trim().split(" ")[0] || null;
        };

        let image = bestFromSrcset(srcset) || src;

        try {
          const u = new URL(image, url);
          const original = u.searchParams.get("url");
          if (original) image = decodeURIComponent(original);
        } catch (_) {}

        // TEXT
        await page.waitForSelector("article p", { timeout: 20000 });
        const text = await page.$$eval("article p", (ps) =>
          ps
            .map((p) => p.textContent.trim())
            .filter(Boolean)
            .join("\n\n")
        );

        try {
          await News.create({
            source: "3news",
            url,
            title,
            text,
            image: image || null,
            timestamp: new Date(),
          });

          log.info(`SAVED ✅ ${title}`);
        } catch (err) {
          // duplicate url (unique index) or other db error
          if (err?.code === 11000) log.info(`SKIPPED (exists) ⏭️ ${title}`);
          else log.error(`DB ERROR ❌ ${title}: ${err.message}`);
        }

        return;
      }
    },
  });

  await crawler.run([{ url: "https://3news.com/news/all", label: "LIST" }]);
};

module.exports = threeNewsCrawler;
