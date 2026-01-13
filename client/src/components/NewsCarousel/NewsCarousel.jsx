import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./news-carousel.styles.scss";

const NewsCarousel = ({ items = [], title = "Top Stories" }) => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const AUTOPLAY_TIME = 8000;

  const normalized = useMemo(() => {
    return (items || [])
      .filter(Boolean)
      .map((n) => ({
        id: n?._id?.$oid || n?._id || n?.id || Math.random(),
        source: (n?.source || "News").toUpperCase(),
        title: n?.title || "",
        text: n?.text || "",
        image: n?.image || "",
        date: n?.timestamp?.$date || n?.timestamp || n?.date,
      }))
      .filter((n) => n.title);
  }, [items]);

  const active = normalized[index];

  const handleNav = (newIdx) => {
    if (isTransitioning || newIdx === index) return;
    setIsTransitioning(true);
    setIndex(newIdx);
    // Matches the SCSS animation duration
    setTimeout(() => setIsTransitioning(false), 850);
  };

  useEffect(() => {
    if (!normalized.length) return;
    const timer = setInterval(() => {
      handleNav((index + 1) % normalized.length);
    }, AUTOPLAY_TIME);
    return () => clearInterval(timer);
  }, [index, normalized.length, isTransitioning]);

  if (!normalized.length) return null;

  return (
    <section className="ag-carousel">
      <div className="ag-carousel-header">
        <h2 className="ag-carousel-label">{title}</h2>
        <div className="ag-carousel-controls">
          <button
            className="ag-nav-btn"
            onClick={() =>
              handleNav(index === 0 ? normalized.length - 1 : index - 1)
            }
          >
            ‹
          </button>
          <button
            className="ag-nav-btn"
            onClick={() => handleNav((index + 1) % normalized.length)}
          >
            ›
          </button>
        </div>
      </div>

      <div
        className={`ag-carousel-viewport ${
          isTransitioning ? "is-animating" : ""
        }`}
      >
        <div className="ag-image-container">
          <div
            className="ag-image-bg"
            key={`img-${active.id}`}
            style={{ backgroundImage: `url(${active.image})` }}
          />
          <div className="ag-overlay" />
        </div>

        <div className="ag-content" key={`content-${active.id}`}>
          <div className="ag-meta">
            <span className="ag-pill">{active.source}</span>
            <span className="ag-date">
              {active.date
                ? new Date(active.date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                  })
                : ""}
            </span>
          </div>

          <h3 className="ag-headline">{active.title}</h3>
          <p className="ag-snippet">{active.text.slice(0, 160)}...</p>

          <div className="ag-actions">
            <button
              className="ag-btn-main"
              onClick={() => navigate(`/news/${active.id}`)}
            >
              Open Article
            </button>
            <button
              className="ag-btn-ghost"
              onClick={() =>
                navigator.clipboard.writeText(
                  `${window.location.origin}/news/${active.id}`
                )
              }
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>

      <div className="ag-dots">
        {normalized.map((_, i) => (
          <button
            key={i}
            className={`ag-dot ${i === index ? "active" : ""}`}
            onClick={() => handleNav(i)}
          />
        ))}
      </div>
    </section>
  );
};

export default NewsCarousel;
