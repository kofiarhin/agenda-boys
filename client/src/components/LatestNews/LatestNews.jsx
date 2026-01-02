// LatestNews.jsx
import "./latest-news.styles.scss";

const LatestNews = ({ items = [] }) => {
  const list = [...items]
    .sort((a, b) => {
      const at = new Date(a?.timestamp?.$date || a?.timestamp || 0).getTime();
      const bt = new Date(b?.timestamp?.$date || b?.timestamp || 0).getTime();
      return bt - at;
    })
    .slice(0, 8); // ✅ always first 8

  return (
    <section className="latest-news">
      <h2 className="latest-news-title">Latest Stories</h2>

      <div className="latest-news-list">
        {list.map((n) => (
          <a
            key={n?._id?.$oid || n?._id || n?.url}
            className="latest-news-item"
            href={n.url}
            target="_blank"
            rel="noreferrer"
          >
            <div className="latest-news-left">
              <div className="latest-news-meta">{n.source}</div>
              <div className="latest-news-headline">{n.title}</div>
            </div>

            {n.image ? (
              <img
                className="latest-news-img"
                src={n.image}
                alt=""
                loading="lazy"
              />
            ) : (
              <div className="latest-news-img-fallback" />
            )}
          </a>
        ))}
      </div>
    </section>
  );
};

export default LatestNews;
