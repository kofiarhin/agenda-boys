// server/services/myjoy/common.js
const { PlaywrightCrawler } = require("crawlee");
const News = require("../../models/news.model");

const cleanText = (s) => (s || "").replace(/\s+/g, " ").trim();

const cleanTitle = (s) =>
  (s || "")
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

const assertNewsModel = () => {
  if (!News || typeof News.updateOne !== "function") {
    throw new Error(
      "News model is not a valid Mongoose model. Ensure news.model exports mongoose.model(...) directly."
    );
  }
};

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
      .locator("img.article-thumb")
      .first()
      .getAttribute("src")
      .catch(() => null)) ||
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
    "#article-text p",
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

// ✅ atomic "check url + insert only if missing" + console logs
const saveIfUrlMissing = async (data) => {
  assertNewsModel();

  const res = await News.updateOne(
    { url: data.url },
    { $setOnInsert: data },
    { upsert: true }
  );

  const inserted = Boolean(res.upsertedCount || res.upsertedId);

  console.log(
    JSON.stringify(
      {
        status: inserted ? "SAVED" : "SKIPPED",
        reason: inserted ? "inserted" : "url exists in db",
        title: data.title,
        url: data.url,
        source: data.source,
        category: data.category,
      },
      null,
      2
    )
  );

  return inserted;
};

const createSectionCrawler = ({ section, url, listSelector }, opts = {}) => {
  const category = section.toLowerCase();

  const crawler = new PlaywrightCrawler({
    maxConcurrency: opts.maxConcurrency ?? 1,
    maxRequestsPerCrawl: opts.maxRequestsPerCrawl ?? 200,

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
      // LIST
      if (request.userData.type === "LIST") {
        await page.waitForLoadState("domcontentloaded");
        await page.waitForSelector(listSelector, { timeout: 15000 });

        const links = await page
          .$$eval(listSelector, (as) => as.length)
          .catch(() => 0);

        await enqueueLinks({
          selector: listSelector,
          label: "DETAILS",
          strategy: "same-domain",
          transformRequestFunction: (req) => ({
            ...req,
            userData: { type: "DETAILS", section },
          }),
        });

        log.info(`LIST done: ${section} | links: ${links}`);
        return;
      }

      // DETAILS
      if (request.userData.type === "DETAILS") {
        await page.waitForLoadState("domcontentloaded");

        await page
          .waitForSelector(".article-title h1", { timeout: 15000 })
          .catch(() => null);

        const data = {
          source: "myjoyonline",
          category,
          url: request.url,
          title: await extractTitle(page),
          text: await extractText(page),
          image: await extractImage(page),
          timestamp: new Date(),
        };

        if (!data.title || !data.text) {
          console.log(
            JSON.stringify(
              {
                status: "SKIP",
                reason: "missing title/text",
                url: request.url,
                source: data.source,
                category: data.category,
              },
              null,
              2
            )
          );
          return;
        }

        await saveIfUrlMissing(data);
      }
    },
  });

  const run = async () => {
    await crawler.run([{ url, userData: { type: "LIST", section } }]);
  };

  return { run };
};

module.exports = {
  createSectionCrawler,
};
