// NewsCategorySection.jsx
import "./news-category-section.styles.scss";
import { Link } from "react-router-dom";

const getExcerpt = (n, max = 120) => {
  const base =
    n?.rewrittenSummary || n?.summary || n?.rewrittenText || n?.text || "";
  const clean = String(base).replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length > max ? `${clean.slice(0, max)}...` : clean;
};

const getTitle = (n) => n?.rewrittenTitle || n?.title || "";

const NewsCategorySection = ({
  category = "",
  data = [],
  limit = 6,
  heading,
}) => {
  const items = (data || [])
    .filter(
      (n) => String(n.category).toLowerCase() === String(category).toLowerCase()
    )
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
    .slice(0, limit);

  if (!items.length) return null;

  return (
    <section className="news-category-section">
      <Link to={`/news?topic=${category}`}>
        <h2 className="news-category-section-title">
          {(heading || category || "").toUpperCase()}
        </h2>
      </Link>

      <div className="news-category-section-grid">
        {items.map((n) => (
          <Link
            key={n._id || n.id || n.url}
            className="news-category-card"
            to={`/news/${n._id}`}
          >
            <div
              className={`news-category-card-media ${
                n.image ? "has-image" : ""
              }`}
              style={
                n.image ? { backgroundImage: `url(${n.image})` } : undefined
              }
            />

            <div className="news-category-card-body">
              <p className="news-category-card-text">
                <span className="news-category-card-text-title">
                  {getTitle(n)}
                </span>
                <span className="news-category-card-text-excerpt">
                  {getExcerpt(n)}
                </span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default NewsCategorySection;
