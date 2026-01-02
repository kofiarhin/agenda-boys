// client/src/components/NewsList.jsx
import { useEffect, useMemo, useState } from "react";
import "./newsList.styles.scss";

const fmtDate = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

const NewsList = ({ items = [], pageSize = 12, maxSources = 6 }) => {
  const [query, setQuery] = useState("");
  const [activeSource, setActiveSource] = useState("all");
  const [page, setPage] = useState(1);

  const normalized = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => ({
      id: item?._id || item?.id || item?.url || crypto.randomUUID(),
      title: item?.title || "Untitled",
      text: item?.text || "",
      source: (item?.source || "").trim(),
      image: item?.image || "",
      url: item?.url || "#",
      timestamp: item?.timestamp || null,
    }));
  }, [items]);

  const sources = useMemo(() => {
    const set = new Set(normalized.map((n) => n.source).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [normalized]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return normalized.filter((n) => {
      const matchesSource =
        activeSource === "all" ? true : n.source === activeSource;

      const matchesQuery = !q
        ? true
        : (n.title || "").toLowerCase().includes(q) ||
          (n.text || "").toLowerCase().includes(q);

      return matchesSource && matchesQuery;
    });
  }, [normalized, query, activeSource]);

  // ✅ reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [query, activeSource, pageSize]);

  // subtle parallax glow follow
  useEffect(() => {
    const root = document.documentElement;
    const onMove = (e) => {
      root.style.setProperty("--mx", `${e.clientX}px`);
      root.style.setProperty("--my", `${e.clientY}px`);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = clamp(page, 1, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const from = totalItems ? (safePage - 1) * pageSize + 1 : 0;
  const to = totalItems ? Math.min(safePage * pageSize, totalItems) : 0;

  const goPrev = () => setPage((p) => clamp(p - 1, 1, totalPages));
  const goNext = () => setPage((p) => clamp(p + 1, 1, totalPages));

  if (!normalized.length) return <div className="news-empty">No news yet.</div>;

  return (
    <section className="news">
      <div className="news-hero">
        <div className="news-hero-left">
          <h2 className="news-hero-title">Today’s Ghana Headlines</h2>
          <p className="news-hero-sub">
            Fast, clean, and punchy. Search + filter, then tap any card.
          </p>
        </div>

        <div className="news-hero-right">
          <div className="news-search">
            <span className="news-search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              className="news-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stories…"
              type="text"
            />
            {query ? (
              <button
                className="news-search-clear"
                onClick={() => setQuery("")}
                type="button"
              >
                Clear
              </button>
            ) : null}
          </div>

          <div className="news-filters" role="tablist" aria-label="Sources">
            {sources.slice(0, maxSources).map((s) => (
              <button
                key={s || "all"}
                className={`news-pill ${activeSource === s ? "is-active" : ""}`}
                onClick={() => setActiveSource(s)}
                type="button"
              >
                {s === "all" ? "All sources" : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ✅ Pagination bar (top) */}
      <div
        className="news-pagination"
        role="navigation"
        aria-label="Pagination"
      >
        <div className="news-pagination-meta">
          {totalItems ? (
            <span className="news-pagination-count">
              Showing {from}–{to} of {totalItems}
            </span>
          ) : (
            <span className="news-pagination-count">No results</span>
          )}
        </div>

        <div className="news-pagination-controls">
          <button
            className="news-pagination-btn"
            type="button"
            onClick={() => setPage(1)}
            disabled={safePage === 1}
            aria-label="First page"
          >
            «
          </button>

          <button
            className="news-pagination-btn"
            type="button"
            onClick={goPrev}
            disabled={safePage === 1}
            aria-label="Previous page"
          >
            ‹
          </button>

          <span className="news-pagination-page">
            Page {safePage} / {totalPages}
          </span>

          <button
            className="news-pagination-btn"
            type="button"
            onClick={goNext}
            disabled={safePage === totalPages}
            aria-label="Next page"
          >
            ›
          </button>

          <button
            className="news-pagination-btn"
            type="button"
            onClick={() => setPage(totalPages)}
            disabled={safePage === totalPages}
            aria-label="Last page"
          >
            »
          </button>
        </div>
      </div>

      <div className="news-grid">
        {paged.map((n, idx) => (
          <article
            key={n.id}
            className={`news-card ${
              safePage === 1 && idx === 0 ? "is-featured" : ""
            }`}
          >
            <a
              className="news-card-link"
              href={n.url}
              target="_blank"
              rel="noreferrer"
            >
              <div className="news-card-media">
                {n.image ? (
                  <img
                    className="news-card-img"
                    src={n.image}
                    alt={n.title}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="news-card-fallback" aria-hidden="true" />
                )}
                <div className="news-card-overlay" aria-hidden="true" />
                <div className="news-card-badges">
                  {n.source ? (
                    <span className="news-badge">{n.source}</span>
                  ) : null}
                  {n.timestamp ? (
                    <span className="news-badge is-muted">
                      {fmtDate(n.timestamp)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="news-card-body">
                <h3 className="news-card-title">{n.title}</h3>
                {n.text ? <p className="news-card-text">{n.text}</p> : null}

                <div className="news-card-footer">
                  <span className="news-card-cta">Read story</span>
                  <span className="news-card-arrow" aria-hidden="true">
                    ↗
                  </span>
                </div>
              </div>
            </a>
          </article>
        ))}
      </div>

      {!filtered.length ? (
        <div className="news-empty">
          No matches. Try a different search or switch source.
        </div>
      ) : null}

      {/* ✅ Pagination bar (bottom) */}
      {totalPages > 1 ? (
        <div
          className="news-pagination is-bottom"
          role="navigation"
          aria-label="Pagination"
        >
          <div className="news-pagination-controls">
            <button
              className="news-pagination-btn"
              type="button"
              onClick={goPrev}
              disabled={safePage === 1}
            >
              Prev
            </button>

            <span className="news-pagination-page">
              Page {safePage} / {totalPages}
            </span>

            <button
              className="news-pagination-btn"
              type="button"
              onClick={goNext}
              disabled={safePage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default NewsList;
