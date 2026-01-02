// server/services/graphic-crawler.js
const { PlaywrightCrawler } = require("crawlee");
const News = require("../models/news.model");

const normalize = (s) => (s ? s.replace(/\s+/g, " ").trim() : "");

const firstText = async (page, selectors) => {
  for (const sel of selectors) {
    try {
      if (sel.startsWith("meta[")) {
        const content = await page
          .locator(sel)
          .getAttribute("content")
          .catch(() => null);
        const t = normalize(content);
        if (t) return t;
        continue;
      }

      const loc = page.locator(sel).first();
      if (await loc.count()) {
        const t = normalize(await loc.innerText());
        if (t) return t;
      }
    } catch {}
  }
  return "";
};

const allParagraphText = async (page, selectors) => {
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel);
      if (await loc.count()) {
        const parts = (await loc.allInnerTexts())
          .map(normalize)
          .filter(Boolean);

        // remove obvious junk lines if present
        const cleaned = parts.filter(
          (p) =>
            p.length > 30 &&
            !/share|facebook|twitter|whatsapp|email|subscribe|advertisement|disclaimer/i.test(
              p
            )
        );

        const joined = normalize(
          (cleaned.length ? cleaned : parts).join("\n\n")
        );
        if (joined) return joined;
      }
    } catch {}
  }
  return "";
};

const firstAttr = async (page, selectors, attr) => {
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first();
      if (await loc.count()) {
        const v = await loc.getAttribute(attr).catch(() => null);
        if (v) return v;
      }
    } catch {}
  }
  return null;
};

const saveIfNew = async (doc) => {
  const exists = await News.exists({ url: doc.url });
  if (exists) return false;

  try {
    await News.create(doc);
    return true;
  } catch (err) {
    if (err && err.code === 11000) return false; // race-safe
    throw err;
  }
};

const graphicCrawler = async () => {
  const crawler = new PlaywrightCrawler({
    launchContext: { launchOptions: { headless: true } },

    requestHandler: async ({ page, enqueueLinks, request, log }) => {
      // -------------------------
      // DETAIL
      // -------------------------
      if (request.label === "DETAIL") {
        log.info(`DETAIL: ${request.url}`);

        try {
          await page.waitForLoadState("domcontentloaded");

          const title = await firstText(page, [
            ".article-header h1",
            ".article-header h1 span",
            "article h1",
            "h1",
            'meta[property="og:title"]',
          ]);

          const text = await allParagraphText(page, [
            ".article-can-edit p",
            ".article-details p",
            "article .entry-content p",
            "article p",
            ".sp-column p",
          ]);

          const image =
            (await firstAttr(page, ["figure.article-full-image img"], "src")) ||
            (await page
              .locator('meta[property="og:image"]')
              .getAttribute("content")
              .catch(() => null)) ||
            null;

          if (!title || !text) {
            log.warning(`Skipped (missing title/text): ${request.url}`);
            return;
          }

          const dataset = {
            url: request.url,
            title: normalize(title),
            text: normalize(text),
            image,
            timestamp: new Date(),
            source: "graphic",
          };

          const saved = await saveIfNew(dataset);
          log.info(
            saved
              ? `✅ Saved: ${dataset.title}`
              : `⏭️ Skipped (exists): ${dataset.url}`
          );
        } catch (err) {
          log.error(`❌ DETAIL failed: ${request.url} | ${err.message}`);
        }

        return;
      }

      // -------------------------
      // HOME (enqueue article links)
      // -------------------------
      try {
        await page.waitForSelector(".raxo-wrap .raxo-content a", {
          timeout: 20000,
        });

        const enqueued = await enqueueLinks({
          selector: ".raxo-wrap .raxo-content a",
          label: "DETAIL",
          transformRequestFunction: (req) => {
            if (!req.url) return null;
            if (!req.url.includes("/news/")) return null;
            if (!req.url.endsWith(".html")) return null;
            return req;
          },
        });

        log.info(`Enqueued: ${enqueued.processedRequests.length}`);
      } catch (err) {
        log.error(`❌ HOME enqueue failed: ${err.message}`);
      }
    },

    maxRequestsPerCrawl: 25,
    navigationTimeoutSecs: 60,
  });

  await crawler.run(["https://www.graphic.com.gh/"]);
};

module.exports = graphicCrawler;
