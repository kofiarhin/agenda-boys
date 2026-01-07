// client/src/components/NewsCarousel/NewsCarousel.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./news-carousel.styles.scss";

const NewsCarousel = ({ items = [], title = "Top Stories" }) => {
  const navigate = useNavigate();
  const cardRef = useRef(null);

  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState("next"); // "next" | "prev"
  const [cycleKey, setCycleKey] = useState(0);

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

  const goTo = (next, forcedDir) => {
    if (!normalized.length) return;

    const clamped = clamp(next, 0, normalized.length - 1);

    if (forcedDir) setDir(forcedDir);
    else setDir(clamped >= index ? "next" : "prev");

    setIndex(clamped);
    setCycleKey((k) => k + 1);

    if (cardRef.current) {
      cardRef.current.style.setProperty("--rx", "0deg");
      cardRef.current.style.setProperty("--ry", "0deg");
      cardRef.current.style.setProperty("--mx", "50%");
      cardRef.current.style.setProperty("--my", "35%");
    }
  };

  const prev = () => goTo(index - 1, "prev");
  const next = () => goTo(index + 1, "next");

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
    setCycleKey((k) => k + 1);
  }, [normalized]);

  useEffect(() => {
    if (normalized.length <= 1) return;

    const t = setInterval(() => {
      setDir("next");
      setIndex((i) => (i + 1) % normalized.length);
      setCycleKey((k) => k + 1);
    }, 10_000);

    return () => clearInterval(t);
  }, [normalized.length]);

  const onTiltMove = (e) => {
    const el = cardRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;

    const ry = (px - 0.5) * 10; // -5..5
    const rx = (0.5 - py) * 10; // -5..5

    el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
    el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
    el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
  };

  const onTiltLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "35%");
  };

  if (!normalized.length) return null;

  const bg = active?.image
    ? `url("${active.image.replace(/"/g, "%22")}")`
    : "none";

  return (
    <section className="news-carousel">
      <div className="news-carousel-header">
        <h2 className="news-carousel-title">{title}</h2>
      </div>

      <div className="news-carousel-stage">
        <div
          key={cycleKey}
          className="news-carousel-progress"
          aria-hidden="true"
        />
        <div className="news-carousel-overlay" aria-hidden="true" />

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
          ref={cardRef}
          key={`${active?.id || index}-${cycleKey}`}
          className={`news-carousel-card is-animating ${
            dir === "next" ? "is-next" : "is-prev"
          }`}
          role="button"
          tabIndex={0}
          onClick={openArticle}
          onMouseMove={onTiltMove}
          onMouseLeave={onTiltLeave}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") openArticle();
          }}
          aria-label="Open story"
        >
          <div className="news-carousel-media">
            <div
              className={`news-carousel-image ${
                active?.image ? "" : "is-fallback"
              }`}
              style={active?.image ? { backgroundImage: bg } : undefined}
              role="img"
              aria-label={active?.title || "News image"}
            />
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
          >
            {i === index ? (
              <span
                key={cycleKey}
                className="news-carousel-dot-ring"
                aria-hidden="true"
              />
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
};

export default NewsCarousel;
