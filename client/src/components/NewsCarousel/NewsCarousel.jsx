// client/src/components/NewsCarousel/NewsCarousel.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./news-carousel.styles.scss";

const NewsCarousel = ({ items = [], title = "Top Stories" }) => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  const normalized = useMemo(() => {
    return (items || [])
      .filter(Boolean)
      .map((n) => {
        const id = n?._id?.$oid || n?._id || n?.id;
        const dateRaw = n?.timestamp?.$date || n?.timestamp || n?.date;
        const date = dateRaw ? new Date(dateRaw) : null;

        return {
          id: id ? String(id) : "",
          source: (n?.source || "").trim(),
          url: (n?.url || "").trim(),
          title: (n?.title || "").trim(),
          text: (n?.text || "").trim(),
          image: (n?.image || "").trim(),
          date,
        };
      })
      .filter((n) => n.id && n.title);
  }, [items]);

  const active = normalized[index];

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const goTo = (next) => {
    if (!normalized.length) return;
    setIndex(clamp(next, 0, normalized.length - 1));
  };

  const prev = () => goTo(index - 1);
  const next = () => goTo(index + 1);

  const openArticle = () => {
    if (!active?.id) return;
    navigate(`/news/${active.id}`);
  };

  const copyLink = async () => {
    const link = active?.url || `${window.location.origin}/news/${active?.id}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch (e) {
      const input = document.createElement("input");
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
  };

  const formatDate = (d) => {
    if (!d || Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const snippet = useMemo(() => {
    const t = (active?.text || "").replace(/\s+/g, " ").trim();
    if (!t) return "";
    return t.length > 220 ? `${t.slice(0, 220)}...` : t;
  }, [active]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, normalized.length]);

  useEffect(() => {
    setIndex(0);
  }, [normalized]);

  if (!normalized.length) return null;

  return (
    <section className="news-carousel">
      <div className="news-carousel-header">
        <h2 className="news-carousel-title">{title}</h2>
      </div>

      <div className="news-carousel-stage">
        <button
          type="button"
          className="news-carousel-nav news-carousel-nav-left"
          onClick={prev}
          disabled={index === 0}
          aria-label="Previous story"
        >
          ‹
        </button>

        <button
          type="button"
          className="news-carousel-nav news-carousel-nav-right"
          onClick={next}
          disabled={index === normalized.length - 1}
          aria-label="Next story"
        >
          ›
        </button>

        <div
          className="news-carousel-card"
          role="button"
          tabIndex={0}
          onClick={openArticle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") openArticle();
          }}
          aria-label="Open story"
        >
          <div className="news-carousel-media">
            {active?.image ? (
              <img
                className="news-carousel-image"
                src={active.image}
                alt={active.title}
                loading="lazy"
              />
            ) : (
              <div
                className="news-carousel-image-fallback"
                aria-hidden="true"
              />
            )}
          </div>

          <div className="news-carousel-body">
            <div className="news-carousel-meta">
              <span className="news-carousel-pill">
                {(active?.source || "source").toUpperCase()}
              </span>
              {active?.date ? (
                <span className="news-carousel-pill">
                  {formatDate(active.date)}
                </span>
              ) : null}
            </div>

            <h3 className="news-carousel-headline">{active?.title}</h3>
            {snippet ? (
              <p className="news-carousel-snippet">{snippet}</p>
            ) : null}

            <div
              className="news-carousel-actions"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="news-carousel-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openArticle();
                }}
              >
                Open article
              </button>

              <button
                type="button"
                className="news-carousel-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  copyLink();
                }}
              >
                Copy link
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="news-carousel-dots" aria-label="Carousel position">
        {normalized.map((n, i) => (
          <button
            key={n.id}
            type="button"
            className={`news-carousel-dot ${i === index ? "is-active" : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Go to story ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default NewsCarousel;
