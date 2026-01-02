// client/src/components/NewsCarousel/NewsCarousel.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./news-carousel.styles.scss";

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

const normalizeItem = (item, idx) => {
  const id = item?._id?.$oid || item?._id || String(idx);
  const title = item?.title || "Untitled";
  const text = item?.text || "";
  const source = (item?.source || "source").toString();
  const url = item?.url || "#";
  const image = item?.image || "";
  const ts = item?.timestamp?.$date || item?.timestamp || null;
  const date = ts ? new Date(ts) : null;

  return { id, title, text, source, url, image, date };
};

const fmtTime = (d) => {
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = () => setReduced(!!mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
};

const NewsCarousel = ({
  items = [],
  autoPlay = true,
  autoPlayMs = 5500,
  startIndex = 0,
  onOpen = () => {},
  maxItems = 10, // ✅ render only 10 items at all times
  pauseOnHover = false, // ✅ NEW: hover no longer kills autoplay by default
  respectReducedMotion = true, // ✅ NEW: allow forcing autoplay even with reduced-motion
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const shouldReduce = respectReducedMotion && reducedMotion;

  const slides = useMemo(() => {
    const arr = Array.isArray(items) ? items : [];
    return arr
      .map(normalizeItem)
      .filter((x) => x && x.title)
      .slice(0, maxItems);
  }, [items, maxItems]);

  const [index, setIndex] = useState(() =>
    clamp(startIndex, 0, Math.max(slides.length - 1, 0))
  );
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [touchHint, setTouchHint] = useState(true);

  const intervalRef = useRef(null);
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const pointerRef = useRef({
    id: null,
    startX: 0,
    lastX: 0,
    active: false,
    moved: false,
  });

  const total = slides.length;

  const goTo = (next) => {
    if (!total) return;
    setIndex((prev) => {
      const n = typeof next === "function" ? next(prev) : next;
      return (n + total) % total;
    });
  };

  const next = () => goTo((i) => i + 1);
  const prev = () => goTo((i) => i - 1);

  useEffect(() => {
    if (!total) return;
    setIndex((i) => clamp(i, 0, total - 1));
  }, [total]);

  // ✅ FIXED AUTOPLAY (clears interval reliably + doesn't get killed by hover unless enabled)
  useEffect(() => {
    if (!autoPlay || shouldReduce || !total) return;
    if (isPaused || isDragging) return;

    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, Number(autoPlayMs) || 5500);

    return () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [autoPlay, autoPlayMs, isPaused, isDragging, shouldReduce, total]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onKey = (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Home") goTo(0);
      if (e.key === "End") goTo(total - 1);
    };

    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [total]);

  useEffect(() => {
    const t = setTimeout(() => setTouchHint(false), 4200);
    return () => clearTimeout(t);
  }, []);

  const onPointerDown = (e) => {
    if (!total) return;
    const track = trackRef.current;
    if (!track) return;

    pointerRef.current = {
      id: e.pointerId,
      startX: e.clientX,
      lastX: e.clientX,
      active: true,
      moved: false,
    };

    setIsDragging(true);
    setIsPaused(true);
    setDragX(0);

    track.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!pointerRef.current.active) return;
    const dx = e.clientX - pointerRef.current.startX;
    pointerRef.current.lastX = e.clientX;
    if (Math.abs(dx) > 6) pointerRef.current.moved = true;
    setDragX(dx);
  };

  const onPointerUp = (e) => {
    const track = trackRef.current;
    const { startX, active } = pointerRef.current;
    if (!active) return;

    const dx = e.clientX - startX;
    const threshold = Math.max(
      48,
      (rootRef.current?.clientWidth || 320) * 0.12
    );

    pointerRef.current.active = false;
    setIsDragging(false);
    setDragX(0);
    setIsPaused(false);

    track?.releasePointerCapture?.(e.pointerId);

    if (dx > threshold) prev();
    if (dx < -threshold) next();
  };

  const onPointerCancel = () => {
    pointerRef.current.active = false;
    setIsDragging(false);
    setDragX(0);
    setIsPaused(false);
  };

  const onMouseEnter = () => {
    if (!pauseOnHover) return;
    setIsPaused(true);
  };

  const onMouseLeave = () => {
    if (!pauseOnHover) return;
    setIsPaused(false);
  };

  const openSlide = (s) => {
    if (!s?.url || s.url === "#") return;
    onOpen(s);
    window.open(s.url, "_blank", "noopener,noreferrer");
  };

  const translatePct = total ? -(index * 100) : 0;
  const dragPx = isDragging ? dragX : 0;

  const trackStyle = {
    transform: `translate3d(calc(${translatePct}% + ${dragPx}px), 0, 0)`,
  };

  if (!total) {
    return (
      <div className="news-carousel news-carousel-empty">
        <div className="news-carousel-empty-card">
          <div className="news-carousel-empty-title">No stories yet</div>
          <div className="news-carousel-empty-sub">
            Pass a non-empty items array to render the carousel.
          </div>
        </div>
      </div>
    );
  }

  const active = slides[index];

  return (
    <section
      ref={rootRef}
      className="news-carousel"
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Top stories"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="news-carousel-shell">
        <div
          ref={trackRef}
          className={`news-carousel-track ${isDragging ? "is-dragging" : ""}`}
          style={trackStyle}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          {slides.map((s, i) => (
            <article
              key={s.id}
              className="news-carousel-slide"
              aria-hidden={i !== index}
            >
              <div className="news-carousel-media">
                {s.image ? (
                  <img
                    className="news-carousel-img"
                    src={s.image}
                    alt={s.title}
                    loading={i === index ? "eager" : "lazy"}
                  />
                ) : (
                  <div className="news-carousel-fallback" aria-hidden="true" />
                )}

                <div className="news-carousel-overlay" aria-hidden="true" />

                <div className="news-carousel-badges">
                  <span className="news-carousel-badge">{s.source}</span>
                  {s.date ? (
                    <span className="news-carousel-badge muted">
                      {fmtTime(s.date)}
                    </span>
                  ) : null}
                </div>

                <button
                  className="news-carousel-open"
                  type="button"
                  onClick={() => openSlide(s)}
                  aria-label={`Open story: ${s.title}`}
                >
                  Read
                </button>
              </div>

              <div className="news-carousel-content">
                <h3 className="news-carousel-title">{s.title}</h3>
                <p className="news-carousel-text">
                  {s.text?.trim()?.slice(0, 220)}
                  {s.text?.trim()?.length > 220 ? "…" : ""}
                </p>

                <div className="news-carousel-actions">
                  <button
                    className="news-carousel-cta"
                    type="button"
                    onClick={() => openSlide(s)}
                  >
                    Open article
                  </button>

                  <button
                    className="news-carousel-ghost"
                    type="button"
                    onClick={() => {
                      const payload = `${s.title}\n\n${s.url}`;
                      navigator.clipboard?.writeText?.(payload);
                    }}
                    aria-label="Copy title and link"
                  >
                    Copy link
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <button
          className="news-carousel-arrow left"
          type="button"
          onClick={prev}
          aria-label="Previous slide"
        >
          ‹
        </button>

        <button
          className="news-carousel-arrow right"
          type="button"
          onClick={next}
          aria-label="Next slide"
        >
          ›
        </button>

        <div
          className="news-carousel-dots"
          role="tablist"
          aria-label="Slide navigation"
        >
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`news-carousel-dot ${i === index ? "active" : ""}`}
              onClick={() => goTo(i)}
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {touchHint ? (
          <div className="news-carousel-hint" aria-hidden="true">
            Swipe
          </div>
        ) : null}
      </div>

      <div className="news-carousel-now">
        <div className="news-carousel-now-label">Now playing</div>
        <div className="news-carousel-now-title">{active?.title}</div>
      </div>
    </section>
  );
};

export default NewsCarousel;
