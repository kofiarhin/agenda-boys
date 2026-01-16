// pages/News/News.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useNews from "../../hooks/useNews";
import useDebounce from "../../hooks/useDebounce";
import NewsList from "../../components/NewsList/NewsList";
import Spinner from "../../components/Spinner/Spinner";
import "./news.styles.scss";

const buildPages = (page, totalPages) => {
  if (totalPages <= 1) return [];

  const delta = 2;
  const left = Math.max(2, page - delta);
  const right = Math.min(totalPages - 1, page + delta);

  const list = [1];

  if (left > 2) list.push("...");

  for (let i = left; i <= right; i++) list.push(i);

  if (right < totalPages - 1) list.push("...");

  list.push(totalPages);

  return list;
};

const News = () => {
  const [params, setParams] = useSearchParams();
  const topic = (params.get("topic") || "all").toLowerCase();
  const pageParam = Math.max(1, Number(params.get("page") || 1));

  const [page, setPageState] = useState(pageParam);
  const [searchTerm, setSearchTerm] = useState("");
  const q = useDebounce(searchTerm.trim(), 300);

  const limit = 12;

  useEffect(() => {
    setPageState(pageParam);
  }, [pageParam]);

  const setPage = (nextPage) => {
    const safe = Math.max(1, Number(nextPage) || 1);

    setPageState(safe);

    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (safe <= 1) next.delete("page");
      else next.set("page", String(safe));
      return next;
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, q]);

  const { data, isLoading, isFetching } = useNews({
    page,
    limit,
    category: topic,
    q,
  });

  const items = data?.items || [];
  const meta = data?.meta || {};
  const total = typeof meta.total === "number" ? meta.total : items.length;
  const totalPages = meta.totalPages || Math.max(1, Math.ceil(total / limit));
  const pageButtons = buildPages(page, totalPages);

  if (isLoading && !data) return <Spinner />;

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
          {isFetching ? " • updating..." : ""}
        </div>
      </div>

      {q && !items.length ? <div className="news-empty">No results</div> : null}

      <NewsList topic={topic} items={items} />

      {totalPages > 1 ? (
        <div className="news-pagination">
          <button
            className="news-pagination-btn"
            type="button"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            Prev
          </button>

          {pageButtons.map((p, idx) =>
            p === "..." ? (
              <span className="news-pagination-ellipsis" key={`e-${idx}`}>
                ...
              </span>
            ) : (
              <button
                key={p}
                className={`news-pagination-btn ${
                  p === page ? "is-active" : ""
                }`}
                type="button"
                onClick={() => setPage(p)}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            )
          )}

          <button
            className="news-pagination-btn"
            type="button"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </button>

          <div className="news-pagination-meta">
            Page {page} / {totalPages}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default News;
