// server/crawlers/citiNewsCrawler.js
const { PlaywrightCrawler } = require("crawlee");
const News = require("../models/news.model");

const normalizeUrl = (url, origin) => {
  if (!url) return null;
  if (url.startsWith("data:")) return null;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${origin}${url}`;
  return url;
};

const stripWpSizeSuffix = (url) => {
  if (!url) return null;
  // .../image-1140x570.jpg -> .../image.jpg (keeps querystring if present)
  return url.replace(/-\d+x\d+(?=\.(jpg|jpeg|png|webp)(\?.*)?$)/i, "");
};

const isValidUpload = (url) =>
  !!url &&
  /\/wp-content\/uploads\//i.test(url) &&
  /\.(jpe?g|png|webp)(\?.*)?$/i.test(url);

const pickLargestFromSrcset = (srcset) => {
  if (!srcset) return null;

  const candidates = srcset
    .split(",")
    .map((s) => s.trim())
    .map((part) => {
      const [u, size] = part.split(/\s+/);
      const w = size && /w$/i.test(size) ? parseInt(size, 10) : 0;
      return { url: u, w: Number.isFinite(w) ? w : 0 };
    })
    .filter((x) => isValidUpload(x.url));

  if (!candidates.length) return null;

  candidates.sort((a, b) => b.w - a.w);
  return candidates[0].url;
};

const getFirstAttr = async (locator, attrs) => {
  for (const a of attrs) {
    const v = await locator.getAttribute(a);
    if (v) return v;
  }
  return null;
};

const getCitiImage = async (page) => {
  await page.waitForLoadState("domcontentloaded");

  // give the theme/lazy loaders a moment to attach featured DOM + meta tags
  await page.waitForLoadState("networkidle").catch(() => {});
  await page
    .waitForSelector(
      'head meta[property="og:image"], head meta[name="twitter:image"], .jeg_featured.featured_image, .post-thumbnail img, .entry-header img, .entry-content img',
      { timeout: 8000 }
    )
    .catch(() => {});

  const origin = new URL(page.url()).origin;

  // 1) meta og/twitter image
  const meta = page.locator(
    'head meta[property="og:image"], head meta[name="og:image"], head meta[name="twitter:image"], head meta[property="twitter:image"]'
  );

  if ((await meta.count()) > 0) {
    const metaUrl = await meta.first().getAttribute("content");
    const fixed = normalizeUrl(metaUrl, origin);
    if (isValidUpload(fixed)) return stripWpSizeSuffix(fixed);
  }

  // 2) featured anchor (usually full-size file)
  const featuredA = page.locator(
    '.jeg_featured.featured_image a[href*="/wp-content/uploads/"], .post-thumbnail a[href*="/wp-content/uploads/"]'
  );

  if ((await featuredA.count()) > 0) {
    const href = await featuredA.first().getAttribute("href");
    const fixed = normalizeUrl(href, origin);
    if (isValidUpload(fixed)) return stripWpSizeSuffix(fixed);
  }

  // 3) featured image tag (handle srcset + lazy attrs)
  const featuredImg = page.locator(
    ".jeg_featured.featured_image img, .post-thumbnail img, .entry-header img"
  );

  if ((await featuredImg.count()) > 0) {
    const img = featuredImg.first();

    const srcsetAttr = await getFirstAttr(img, [
      "data-srcset",
      "data-lazy-srcset",
      "srcset",
    ]);

    const bestFromSet = pickLargestFromSrcset(srcsetAttr);
    if (bestFromSet)
      return stripWpSizeSuffix(normalizeUrl(bestFromSet, origin));

    const src = await getFirstAttr(img, [
      "data-src",
      "data-lazy-src",
      "data-original",
      "src",
    ]);

    const fixed = normalizeUrl(src, origin);
    if (isValidUpload(fixed)) return stripWpSizeSuffix(fixed);
  }

  // 4) fallback: first upload image in article content (check a few)
  const contentImgs = page.locator(
    '.entry-content img[src*="/wp-content/uploads/"], .entry-content img[data-src*="/wp-content/uploads/"], .entry-content img'
  );

  const count = await contentImgs.count();
  for (let i = 0; i < Math.min(count, 12); i += 1) {
    const img = contentImgs.nth(i);

    const srcsetAttr = await getFirstAttr(img, [
      "data-srcset",
      "data-lazy-srcset",
      "srcset",
    ]);

    const bestFromSet = pickLargestFromSrcset(srcsetAttr);
    if (bestFromSet) {
      const fixed = normalizeUrl(bestFromSet, origin);
      if (isValidUpload(fixed)) return stripWpSizeSuffix(fixed);
    }

    const src = await getFirstAttr(img, [
      "data-src",
      "data-lazy-src",
      "data-original",
      "src",
    ]);

    const fixed = normalizeUrl(src, origin);
    if (isValidUpload(fixed)) return stripWpSizeSuffix(fixed);
  }

  return null;
};

const citiNewsCrawler = async () => {
  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 300,

    requestHandler: async ({ page, request, enqueueLinks }) => {
      const label = request.label || request.userData?.label;

      if (label === "LIST") {
        const listSelector = "h3.jeg_post_title a";
        await page.waitForSelector(listSelector);
        await enqueueLinks({ selector: listSelector, label: "NEWS" });
        return;
      }

      if (label === "NEWS") {
        const titleSelector = "div.entry-header h1.jeg_post_title";
        const textSelector = "div.entry-content";

        await page.waitForSelector(titleSelector);

        const image = await getCitiImage(page);

        const data = {
          source: "citinews",
          url: request.url,
          title: (await page.locator(titleSelector).first().innerText()).trim(),
          text: (await page.locator(textSelector).first().innerText()).trim(),
          image: image || null,
          timestamp: new Date(),
        };

        const exists = await News.exists({ url: data.url });
        if (exists) {
          console.log({ skipped: true, url: data.url });
          return;
        }

        await News.create(data);
        console.log({ saved: true, url: data.url, image: data.image });
      }
    },
  });

  await crawler.run([{ url: "https://citinewsroom.com/news/", label: "LIST" }]);
};

module.exports = citiNewsCrawler;
