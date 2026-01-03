// NewsList.jsx
import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./newslist.styles.scss";

const toId = (item) => item?._id?.$oid || item?._id || item?.id;
const normalizeSource = (s = "") =>
  String(s || "")
    .toUpperCase()
    .replace(/\s+/g, "");

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

const NewsCard = ({ item }) => {
  const id = toId(item);
  const d = toDate(item);
  const time = formatDate(d);

  const src = item?.source ? normalizeSource(item.source) : "NEWS";
  const title = item?.title || "Untitled";
  const text = item?.text || "";
  const img = item?.image || "";

  return (
    <article className="news-card">
      <Link className="news-card-link" to={`/news/${id}`}>
        <div className="news-card-media">
          {img ? (
            <img
              className="news-card-img"
              src={img}
              alt={title}
              loading="lazy"
            />
          ) : (
            <div
              className="news-card-img news-card-img--fallback"
              aria-hidden="true"
            />
          )}

          <div className="news-card-badges">
            <span className="news-pill">{src}</span>
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
    const end = start + (maxBtns - 1);
    return Array.from({ length: maxBtns }, (_, i) => start + i).filter(
      (p) => p >= 1 && p <= totalPages
    );
  }, [page, totalPages]);

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="news-pagination" role="navigation" aria-label="Pagination">
      <button
        type="button"
        className="news-page-btn"
        onClick={() => onPageChange(page - 1)}
        disabled={prevDisabled}
      >
        Prev
      </button>

      <button
        type="button"
        className="news-page-btn"
        onClick={() => onPageChange(1)}
        disabled={page === 1}
      >
        1
      </button>

      {totalPages > 6 && windowPages[0] > 2 ? (
        <span className="news-ellipsis">…</span>
      ) : null}

      {windowPages
        .filter((p) => p !== 1 && p !== totalPages)
        .map((p) => (
          <button
            key={p}
            type="button"
            className={`news-page-btn ${
              p === page ? "news-page-btn--active" : ""
            }`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}

      {totalPages > 6 &&
      windowPages[windowPages.length - 1] < totalPages - 1 ? (
        <span className="news-ellipsis">…</span>
      ) : null}

      {totalPages > 1 ? (
        <button
          type="button"
          className={`news-page-btn ${
            page === totalPages ? "news-page-btn--active" : ""
          }`}
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </button>
      ) : null}

      <button
        type="button"
        className="news-page-btn"
        onClick={() => onPageChange(page + 1)}
        disabled={nextDisabled}
      >
        Next
      </button>
    </div>
  );
};

const NewsList = ({
  items = [],
  emptyText = "No stories yet.",
  pageSize = 9,
  initialPage = 1,
  scrollToTopOnPageChange = true,
}) => {
  const list = Array.isArray(items) ? items : [];

  const [page, setPage] = useState(initialPage);

  const totalPages = useMemo(() => {
    const total = Math.ceil(list.length / pageSize);
    return total > 0 ? total : 1;
  }, [list.length, pageSize]);

  useEffect(() => {
    setPage((p) => clamp(p, 1, totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [list, page, pageSize]);

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
    </section>
  );
};

export default NewsList;
