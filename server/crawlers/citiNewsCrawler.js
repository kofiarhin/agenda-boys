// server/crawlers/citiNewsCrawler.js
const { PlaywrightCrawler } = require("crawlee");
const News = require("../models/news.model");

const normalizeUrl = (url, origin) => {
  if (!url) return null;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${origin}${url}`;
  return url;
};

const stripWpSizeSuffix = (url) => {
  // turns .../image-1140x570.jpg -> .../image.jpg
  return url.replace(/-\d+x\d+(?=\.(jpg|jpeg|png|webp)(\?.*)?$)/i, "");
};

const getCitiImage = async (page) => {
  const img = await page.evaluate(() => {
    const pickFromMeta = () => {
      const og =
        document.querySelector('meta[property="og:image"]') ||
        document.querySelector('meta[name="og:image"]') ||
        document.querySelector('meta[name="twitter:image"]') ||
        document.querySelector('meta[property="twitter:image"]');

      const content = og?.getAttribute("content");
      return content || null;
    };

    const getImgSrc = (el) => {
      if (!el) return null;
      return (
        el.getAttribute("data-src") ||
        el.getAttribute("data-lazy-src") ||
        el.getAttribute("data-original") ||
        el.currentSrc ||
        el.getAttribute("src") ||
        null
      );
    };

    const isValidUpload = (url) =>
      !!url &&
      /\/wp-content\/uploads\//i.test(url) &&
      /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(url);

    // 1) best: og:image (usually the real featured image)
    const metaUrl = pickFromMeta();
    if (isValidUpload(metaUrl)) return metaUrl;

    // 2) featured image area (article page)
    const featuredRoot =
      document.querySelector(".jeg_featured.featured_image") ||
      document.querySelector(".jeg_featured_featured_image") ||
      document.querySelector(".post-thumbnail") ||
      document.querySelector(".entry-header");

    if (featuredRoot) {
      const a = featuredRoot.querySelector('a[href*="/wp-content/uploads/"]');
      const href = a?.getAttribute("href");
      if (isValidUpload(href)) return href;

      const featuredImg =
        featuredRoot.querySelector("img.wp-post-image") ||
        featuredRoot.querySelector('img[class*="attachment-"]') ||
        featuredRoot.querySelector('img[src*="/wp-content/uploads/"]') ||
        featuredRoot.querySelector('img[data-src*="/wp-content/uploads/"]');

      const src = getImgSrc(featuredImg);
      if (isValidUpload(src)) return src;
    }

    // 3) fallback: first real upload image inside article content
    const content = document.querySelector(".entry-content") || document.body;
    const imgs = Array.from(content.querySelectorAll("img"));

    for (const el of imgs) {
      const src = getImgSrc(el);
      if (isValidUpload(src)) return src;
    }

    return null;
  });

  if (!img) return null;

  const origin = await page.evaluate(() => location.origin);
  const fixed = normalizeUrl(img, origin);

  // prefer original full image if WP returns resized variant
  return fixed ? stripWpSizeSuffix(fixed) : null;
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
