import { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./newslist.styles.scss";

const toId = (item) => item?._id?.$oid || item?._id || item?.id;

const normalizeSource = (s = "") =>
  String(s || "")
    .toUpperCase()
    .replace(/\s+/g, "");

const normalizeCategory = (c = "") => {
  const raw = String(c || "").trim();
  if (!raw) return "";
  return raw.toLowerCase();
};

const toDate = (item) => {
  const raw = item?.timestamp?.$date || item?.timestamp || item?.date;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDate = (d) => {
  if (!d) return "";
  const dd = new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
  const tt = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${dd}, ${tt}`;
};

const excerpt = (text = "", max = 140) => {
  const clean = String(text).replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length > max ? `${clean.slice(0, max).trim()}…` : clean;
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const useInView = ({
  root = null,
  rootMargin = "400px 0px",
  threshold = 0,
} = {}) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { root, rootMargin, threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [root, rootMargin, threshold]);

  return { ref, inView };
};

const LazyImage = ({ src, alt }) => {
  const { ref, inView } = useInView();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  return (
    <div ref={ref} className="news-card-img-wrap">
      {inView && src && !failed ? (
        <img
          className={`news-card-img ${loaded ? "news-card-img--loaded" : ""}`}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}

      {!loaded && !failed ? (
        <div
          className="news-card-img news-card-img--skeleton"
          aria-hidden="true"
        />
      ) : null}

      {failed || !src ? (
        <div
          className="news-card-img news-card-img--fallback"
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
};

const NewsCard = ({ item }) => {
  const id = toId(item);
  const d = toDate(item);
  const time = formatDate(d);

  const src = item?.source ? normalizeSource(item.source) : "NEWS";
  const category = normalizeCategory(item?.category);
  const categoryLabel = category ? category.toUpperCase() : "";

  const title = item?.title || "Untitled";
  const text = item?.text || "";
  const img = item?.image || "";

  return (
    <article className="news-card">
      <Link className="news-card-link" to={`/news/${id}`}>
        <div className="news-card-media">
          <LazyImage src={img} alt={title} />

          <div className="news-card-badges">
            <span className="news-pill">{src}</span>
            {categoryLabel ? (
              <span className="news-pill news-pill--category">
                {categoryLabel}
              </span>
            ) : null}
            {time ? (
              <span className="news-pill news-pill--time">{time}</span>
            ) : null}
          </div>

          <div className="news-card-fade" aria-hidden="true" />
        </div>

        <div className="news-card-body">
          <h3 className="news-card-title">{title}</h3>
          <p className="news-card-text">{excerpt(text, 140)}</p>

          <div className="news-card-cta">
            <span className="news-card-cta-text">Read story</span>
            <span className="news-card-cta-icon" aria-hidden="true">
              ↗
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
};

const Pagination = ({ page, totalPages, onPageChange }) => {
  const windowPages = useMemo(() => {
    const maxBtns = 5;
    if (totalPages <= maxBtns)
      return Array.from({ length: totalPages }, (_, i) => i + 1);

    const start = clamp(page - 2, 1, totalPages - (maxBtns - 1));
    return Array.from({ length: maxBtns }, (_, i) => start + i).filter(
      (p) => p >= 1 && p <= totalPages
    );
  }, [page, totalPages]);

  return (
    <div className="news-pagination" role="navigation" aria-label="Pagination">
      <button
        className="news-page-btn"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Prev
      </button>

      {windowPages.map((p) => (
        <button
          key={p}
          className={`news-page-btn ${
            p === page ? "news-page-btn--active" : ""
          }`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}

      <button
        className="news-page-btn"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </div>
  );
};

const NewsList = ({
  topic = "all",
  items = [],
  emptyText = "No stories yet.",
  pageSize = 9,
  initialPage = 1,
  scrollToTopOnPageChange = true,
}) => {
  const list = Array.isArray(items) ? items : [];
  const [page, setPage] = useState(initialPage);
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => {
    const set = new Set();
    list.forEach((x) => {
      const c = normalizeCategory(x?.category);
      if (c) set.add(c);
    });
    return ["all", ...Array.from(set)];
  }, [list]);

  // ✅ topic -> category dropdown on load + when topic changes
  useEffect(() => {
    const t = normalizeCategory(topic);
    setCategory(t && categories.includes(t) ? t : "all");
    setPage(1);
  }, [topic, categories]);

  const filtered = useMemo(() => {
    if (category === "all") return list;
    return list.filter((x) => normalizeCategory(x?.category) === category);
  }, [list, category]);

  const totalPages = useMemo(() => {
    const total = Math.ceil(filtered.length / pageSize);
    return total > 0 ? total : 1;
  }, [filtered.length, pageSize]);

  useEffect(() => setPage(1), [category]);
  useEffect(() => setPage((p) => clamp(p, 1, totalPages)), [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const onPageChange = (next) => {
    const nextPage = clamp(next, 1, totalPages);
    if (nextPage === page) return;
    setPage(nextPage);
    if (scrollToTopOnPageChange)
      window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!list.length) return <div className="news-empty">{emptyText}</div>;

  return (
    <section className="news-list" aria-label="News list">
      <div className="news-toolbar">
        <div className="news-filter">
          <span className="news-filter-label">Category</span>
          <select
            className="news-filter-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All" : c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="news-filter-count">
          {filtered.length} {filtered.length === 1 ? "story" : "stories"}
        </div>
      </div>

      {!filtered.length ? (
        <div className="news-empty">No stories in this category.</div>
      ) : (
        <>
          <div className="news-grid">
            {pageItems.map((item) => (
              <NewsCard key={toId(item)} item={item} />
            ))}
          </div>

          <div className="news-pagination-wrap">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        </>
      )}
    </section>
  );
};

export default NewsList;
