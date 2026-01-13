// pages/News/News.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useNews from "../../hooks/useNews";
import useDebounce from "../../hooks/useDebounce";
import NewsList from "../../components/NewsList/NewsList";
import Spinner from "../../components/Spinner/Spinner";
import "./news.styles.scss";

const News = () => {
  const [params] = useSearchParams();
  const topic = (params.get("topic") || "all").toLowerCase();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const q = useDebounce(searchTerm.trim(), 300);

  useEffect(() => {
    setPage(1);
  }, [topic, q]);

  const { data, isLoading } = useNews({
    page,
    limit: 12,
    category: topic,
    q,
  });

  if (isLoading && !data) return <Spinner />;

  const items = data?.items || [];
  const total = data?.meta?.total ?? items.length;

  return (
    <div id="news-page" className="container">
      <div className="news-search-wrap">
        <input
          className="news-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSearchTerm("");
          }}
          placeholder="Search stories..."
        />

        {searchTerm ? (
          <button
            className="news-search-clear"
            type="button"
            onClick={() => setSearchTerm("")}
            aria-label="Clear search"
            title="Clear"
          >
            ×
          </button>
        ) : null}

        <div className="news-count">
          {q ? `${total} results` : `${total} stories`}
        </div>
      </div>

      {q && !items.length ? <div className="news-empty">No results</div> : null}

      <NewsList topic={topic} items={items} />
    </div>
  );
};

export default News;
