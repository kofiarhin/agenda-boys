// server/services/myjoyCrawler.js
const { PlaywrightCrawler } = require("crawlee");
const News = require("../models/news.model");

const CONFIG = {
  NATIONAL: {
    url: "https://www.myjoyonline.com/news/national/",
    listSelector: "div.img-holder a.bgposition.general-height[href]",
  },
  POLITICS: {
    url: "https://www.myjoyonline.com/news/politics/",
    listSelector: ".home-section-story-list.text-center a[href]",
  },
  BUSINESS: {
    url: "https://www.myjoyonline.com/business/",
    listSelector: ".home-section-story-list.tt-center a[href]",
  },
};

const cleanText = (s) => (s || "").replace(/\s+/g, " ").trim();

const cleanTitle = (s) =>
  (s || "")
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

const getMeta = async (page, key) => {
  const v = await page
    .locator(`meta[property="${key}"], meta[name="${key}"]`)
    .first()
    .getAttribute("content")
    .catch(() => null);
  return v || null;
};

const extractTitle = async (page) => {
  const t = await page
    .locator(".article-title h1")
    .first()
    .innerText()
    .catch(() => "");
  if (t && cleanTitle(t).length > 5) return cleanTitle(t);

  const og = await getMeta(page, "og:title");
  if (og && cleanTitle(og).length > 5) return cleanTitle(og);

  const tw = await getMeta(page, "twitter:title");
  if (tw && cleanTitle(tw).length > 5) return cleanTitle(tw);

  return cleanTitle(await page.title().catch(() => ""));
};

const extractImage = async (page) => {
  const og = await getMeta(page, "og:image");
  if (og) return og;

  return (
    (await page
      .locator("article img")
      .first()
      .getAttribute("src")
      .catch(() => null)) ||
    (await page
      .locator("img")
      .first()
      .getAttribute("src")
      .catch(() => null)) ||
    null
  );
};

const extractText = async (page) => {
  const selectors = [
    "article p",
    ".entry-content p",
    ".post-content p",
    ".single-content p",
  ];

  for (const sel of selectors) {
    const text = await page
      .$$eval(sel, (ps) =>
        ps
          .map((p) => (p.innerText || "").trim())
          .filter(Boolean)
          .join("\n\n")
      )
      .catch(() => "");
    const cleaned = cleanText(text);
    if (cleaned.length > 150) return cleaned;
  }

  const fallback = await page
    .$$eval("p", (ps) =>
      ps
        .map((p) => (p.innerText || "").trim())
        .filter((t) => t.length > 40)
        .slice(0, 40)
        .join("\n\n")
    )
    .catch(() => "");

  return cleanText(fallback);
};

const saveIfNew = async (data) => {
  try {
    await News.create(data);
    return { saved: true };
  } catch (err) {
    if (err && err.code === 11000) return { saved: false };
    throw err;
  }
};

const myJoyOnline = async () => {
  const crawler = new PlaywrightCrawler({
    maxConcurrency: 1,
    maxRequestsPerCrawl: 200,

    preNavigationHooks: [
      async ({ page }) => {
        await page.route("**/*", (route) => {
          const t = route.request().resourceType();
          if (["image", "media", "font", "stylesheet"].includes(t))
            return route.abort();
          route.continue();
        });
      },
    ],

    requestHandler: async ({ request, page, enqueueLinks, log }) => {
      const section = request.userData.section;
      const category = section.toLowerCase();

      // LIST -> enqueue DETAILS using section-specific selector
      if (request.userData.type === "LIST") {
        const { listSelector } = CONFIG[section];

        await page.waitForLoadState("domcontentloaded");
        await page.waitForSelector(listSelector, { timeout: 15000 });

        await enqueueLinks({
          selector: listSelector,
          label: "DETAILS",
          strategy: "same-domain",
          transformRequestFunction: (req) => ({
            ...req,
            userData: { type: "DETAILS", section },
          }),
        });

        log.info(`LIST done: ${section}`);
        return;
      }

      // DETAILS -> save to DB
      if (request.userData.type === "DETAILS") {
        await page.waitForLoadState("domcontentloaded");

        // ✅ IMPORTANT: only wait for the real article title container (no ", h1")
        await page
          .waitForSelector(".article-title h1", { timeout: 15000 })
          .catch(() => null);

        const data = {
          source: "myjoyonline",
          category, // national | politics | business
          url: request.url,
          title: await extractTitle(page),
          text: await extractText(page),
          image: await extractImage(page),
          timestamp: new Date(),
        };

        if (!data.title || !data.text) {
          log.warning(`SKIP (missing title/text): ${request.url}`);
          return;
        }

        const res = await saveIfNew(data);
        if (res.saved) console.log("[SAVED]", data.category, data.title);
        else console.log("[DUP]", data.category, data.title);
      }
    },
  });

  await crawler.run([
    {
      url: CONFIG.NATIONAL.url,
      userData: { type: "LIST", section: "NATIONAL" },
    },
    {
      url: CONFIG.POLITICS.url,
      userData: { type: "LIST", section: "POLITICS" },
    },
    {
      url: CONFIG.BUSINESS.url,
      userData: { type: "LIST", section: "BUSINESS" },
    },
  ]);
};

module.exports = myJoyOnline;
