import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./newslist.styles.scss";

// --- Helpers ---
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
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
};

const excerpt = (text = "", max = 140) => {
  const clean = String(text).replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length > max ? `${clean.slice(0, max).trim()}…` : clean;
};

// --- Custom Hooks ---
const useInView = ({
  root = null,
  rootMargin = "400px 0px",
  threshold = 0,
} = {}) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
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

// --- Sub-components ---
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
      {!loaded && !failed && (
        <div
          className="news-card-img news-card-img--skeleton"
          aria-hidden="true"
        />
      )}
      {(failed || !src) && (
        <div
          className="news-card-img news-card-img--fallback"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

const NewsCard = ({ item, index = 0 }) => {
  const id = toId(item);
  const d = toDate(item);
  const time = formatDate(d);
  const src = item?.source ? normalizeSource(item.source) : "NEWS";
  const categoryLabel = normalizeCategory(item?.category).toUpperCase();
  const title = item?.title || "Untitled";
  const text = item?.text || "";
  const img = item?.image || "";

  return (
    <article className="news-card" style={{ "--i": index }}>
      <Link className="news-card-link" to={`/news/${id}`}>
        <div className="news-card-media">
          <LazyImage src={img} alt={title} />
          <div className="news-card-badges">
            <span className="news-pill">{src}</span>
            {categoryLabel && (
              <span className="news-pill">{categoryLabel}</span>
            )}
            {time && <span className="news-pill">{time}</span>}
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

// --- Main Component ---
const NewsList = ({
  topic = "all",
  items = [],
  meta,
  emptyText = "No stories yet.",
}) => {
  const navigate = useNavigate();
  const [category, setCategory] = useState("all");

  useEffect(() => {
    setCategory(normalizeCategory(topic) || "all");
  }, [topic]);

  const total = meta?.total ?? items.length;
  const label = `${total} stories`;

  return (
    <section id="news-list">
      <div className="news-toolbar">
        <div className="news-filter">
          <select
            className="news-filter-select"
            value={category}
            onChange={(e) => {
              const next = e.target.value;
              setCategory(next);
              navigate(`/news?topic=${next}`);
            }}
          >
            <option value="all">All Categories</option>
            <option value="national">National</option>
            <option value="politics">Politics</option>
            <option value="business">Business</option>
            <option value="sports">Sports</option>
          </select>
        </div>

        <div className="news-filter-count">{label}</div>
      </div>

      {!items.length ? (
        <div className="news-empty">{emptyText}</div>
      ) : (
        <div className="news-grid" key={category}>
          {items.map((item, idx) => (
            <NewsCard key={toId(item)} item={item} index={idx} />
          ))}
        </div>
      )}
    </section>
  );
};

export default NewsList;
