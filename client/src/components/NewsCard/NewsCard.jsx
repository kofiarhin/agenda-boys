import "./newsCard.styles.scss";

const NewsCard = ({ article }) => {
  const { title, text, image, url, timestamp } = article;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <article className="news-card">
      {image && (
        <div className="news-card__image-wrapper">
          <img src={image} alt={title} className="news-card__image" />
        </div>
      )}

      <div className="news-card__content">
        <span className="news-card__source">MyJoyOnline</span>
        <h2 className="news-card__title">
          <a href={url} target="_blank" rel="noopener noreferrer">
            {title}
          </a>
        </h2>
        <p className="news-card__text">
          {text
            ? `${text.substring(0, 100)}...`
            : "Click to read more about this story."}
        </p>
        <div className="news-card__footer">
          <time className="news-card__date">{formatDate(timestamp)}</time>
        </div>
      </div>
    </article>
  );
};

export default NewsCard;
