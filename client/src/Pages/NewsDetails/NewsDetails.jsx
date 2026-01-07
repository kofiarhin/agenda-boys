// NewsDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useNewsDetails from "../../hooks/useNewsDetails";
import "./news-details.styles.scss";

const NewsDetails = () => {
  const { id } = useParams();
  const { data, isLoading, isError } = useNewsDetails(id);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  if (isLoading) {
    return (
      <div className={`news-details ${mounted ? "is-mounted" : ""}`}>
        <div className="news-details-inner">
          <div className="news-details-skeleton-title" />
          <div className="news-details-skeleton-image" />
          <div className="news-details-skeleton-line" />
          <div className="news-details-skeleton-line" />
          <div className="news-details-skeleton-line short" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`news-details ${mounted ? "is-mounted" : ""}`}>
        <div className="news-details-inner">
          <p className="news-details-error">Failed to load this article.</p>
        </div>
      </div>
    );
  }

  const bodyText = data?.summary || data?.text;

  return (
    <div className={`news-details ${mounted ? "is-mounted" : ""}`}>
      <div className="news-details-inner">
        <header className="news-details-header">
          <h1 className="news-details-title">{data?.title}</h1>
        </header>

        {data?.image ? (
          <div className="news-details-hero">
            <img
              className="news-details-image"
              src={data?.image}
              alt={data?.title || "News image"}
              loading="lazy"
            />
          </div>
        ) : null}

        {bodyText ? (
          <article className="news-details-body">
            <p className="news-details-text">{bodyText}</p>
          </article>
        ) : null}

        {data?.url ? (
          <div className="news-details-actions">
            <a
              className="news-details-link"
              href={data?.url}
              target="_blank"
              rel="noreferrer"
            >
              Continue reading
              <span className="news-details-link-arrow">→</span>
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default NewsDetails;
