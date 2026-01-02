// Summary.jsx
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import "./summary.styles.scss";

const fetchSummary = async () => {
  const res = await fetch("http://localhost:5000/api/summary", {
    credentials: "include",
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Request failed: ${res.status}`);
  }

  return res.json();
};

const Summary = () => {
  const [activeSource, setActiveSource] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("latest"); // latest | oldest | title

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["summary"],
    queryFn: fetchSummary,
    staleTime: 30_000,
    retry: 1,
  });

  const items = useMemo(() => {
    const list = Array.isArray(data?.news)
      ? data.news
      : Array.isArray(data)
      ? data
      : [];

    const normalized = list.map((n) => {
      const ts = n?.timestamp ? new Date(n.timestamp) : null;
      return {
        ...n,
        _id: n?._id || n?.id || `${n?.url || ""}-${n?.title || ""}`,
        _ts: ts && !Number.isNaN(ts.getTime()) ? ts : null,
        _source: (n?.source || "unknown").toLowerCase(),
        _title: (n?.title || "").trim(),
        _text: (n?.text || "").trim(),
      };
    });

    const sources = normalized.map((n) => n._source);

    const filtered = normalized.filter((n) => {
      if (activeSource !== "all" && n._source !== activeSource) return false;

      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      return (
        n._title.toLowerCase().includes(q) ||
        n._text.toLowerCase().includes(q) ||
        (n?.url || "").toLowerCase().includes(q)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sort === "title") return a._title.localeCompare(b._title);

      const aTime = a._ts ? a._ts.getTime() : 0;
      const bTime = b._ts ? b._ts.getTime() : 0;

      if (sort === "oldest") return aTime - bTime;
      return bTime - aTime; // latest
    });

    const countsBySource = sources.reduce((acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    return { sorted, countsBySource };
  }, [data, activeSource, query, sort]);

  const sourcesList = useMemo(() => {
    const entries = Object.entries(items.countsBySource).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    return [
      { key: "all", label: "All", count: items.sorted.length },
      ...entries.map(([k, v]) => ({ key: k, label: k, count: v })),
    ];
  }, [items.countsBySource, items.sorted.length]);

  return (
    <section className="summary">
      <header className="summary-header">
        <div className="summary-title">
          <h2>Summary</h2>
          <p>
            {isLoading
              ? "Loading…"
              : `${items.sorted.length} article${
                  items.sorted.length === 1 ? "" : "s"
                }`}
          </p>
        </div>

        <div className="summary-controls">
          <div className="summary-search">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles or text..."
              aria-label="Search"
              disabled={isLoading}
            />
          </div>

          <div className="summary-sort">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort"
              disabled={isLoading}
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>

        <div className="summary-filters" role="tablist" aria-label="Sources">
          {sourcesList.map((s) => (
            <button
              key={s.key}
              className={`summary-chip ${
                activeSource === s.key ? "is-active" : ""
              }`}
              onClick={() => setActiveSource(s.key)}
              role="tab"
              aria-selected={activeSource === s.key}
              type="button"
              disabled={isLoading}
            >
              <span className="summary-chip-label">{s.label}</span>
              <span className="summary-chip-count">{s.count}</span>
            </button>
          ))}
        </div>

        {isError ? (
          <div className="summary-error">
            <p>{error?.message || "Failed to load."}</p>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? "Retrying…" : "Retry"}
            </button>
          </div>
        ) : null}
      </header>

      <div className="summary-list">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="summary-card skeleton">
              <div className="summary-card-top">
                <div className="summary-card-image placeholder" />
                <div className="summary-skel-line" />
                <div className="summary-skel-line short" />
                <div className="summary-skel-line" />
              </div>
            </div>
          ))
        ) : (
          <>
            {items.sorted.map((n) => (
              <article key={n._id} className="summary-card">
                <a
                  className="summary-card-link"
                  href={n.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="summary-card-top">
                    {n.image ? (
                      <img
                        className="summary-card-image"
                        src={n.image}
                        alt={n.title || "news"}
                      />
                    ) : (
                      <div className="summary-card-image placeholder" />
                    )}

                    <div className="summary-card-meta">
                      <div className="summary-card-badges">
                        <span className="badge">{n._source}</span>
                        {n._ts ? (
                          <span className="badge muted">
                            {n._ts.toLocaleString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="summary-card-title">{n.title}</h3>
                      <p className="summary-card-excerpt">
                        {(n.text || "").replace(/\s+/g, " ").slice(0, 220)}
                        {(n.text || "").length > 220 ? "…" : ""}
                      </p>
                    </div>
                  </div>
                </a>
              </article>
            ))}

            {!items.sorted.length && !isError ? (
              <div className="summary-empty">
                <p>No results.</p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
};

export default Summary;
