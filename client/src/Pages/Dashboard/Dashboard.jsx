import React, { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import "./dashboard.styles.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Dashboard = () => {
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();

  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [preferences, setPreferences] = useState({
    preferredCategories: [],
    preferredSources: [],
    keywords: [],
  });
  const [prefStatus, setPrefStatus] = useState("idle");

  const categories = [
    "national",
    "politics",
    "business",
    "sports",
    "tech",
    "world",
    "health",
    "entertainment",
  ];

  const fetchSavedNews = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setSavedItems([]);
        return;
      }

      const res = await fetch(`${API_URL}/api/news/saved-news`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setSavedItems([]);
        return;
      }

      const json = await res.json();

      const items = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
        ? json.data
        : [];

      setSavedItems(items);
    } catch (e) {
      setSavedItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/users/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const data = await res.json();
      setPreferences({
        preferredCategories: data?.preferredCategories || [],
        preferredSources: data?.preferredSources || [],
        keywords: data?.keywords || [],
      });
    } catch {
      setPreferences({
        preferredCategories: [],
        preferredSources: [],
        keywords: [],
      });
    }
  };

  const updatePreferences = async (e) => {
    e.preventDefault();
    setPrefStatus("saving");

    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/users/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      if (res.ok) setPrefStatus("saved");
      else setPrefStatus("error");
    } catch {
      setPrefStatus("error");
    } finally {
      setTimeout(() => setPrefStatus("idle"), 2000);
    }
  };

  const updateSavedItem = async (newsId, payload) => {
    if (!newsId) return;

    setUpdatingId(newsId);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/news/saved-news/${newsId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return;

      const updated = await res.json();
      setSavedItems((prev) =>
        prev.map((item) => {
          const id = item?.newsId?._id || item?.newsId;
          if (id !== newsId) return item;
          return { ...item, ...updated, newsId: item?.newsId };
        })
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const removeSaved = async (newsId) => {
    if (!newsId) return;

    setRemovingId(newsId);

    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/news/saved-news/${newsId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      setSavedItems((prev) =>
        prev.filter((item) => {
          const news = item?.newsId;
          const id = news?._id || news?.id || item?.newsId;
          return id !== newsId;
        })
      );
    } finally {
      setRemovingId(null);
    }
  };

  useEffect(() => {
    if (!isSignedIn) {
      setSavedItems([]);
      setLoading(false);
      return;
    }

    fetchSavedNews();
    fetchPreferences();
  }, [isSignedIn]);

  if (!isSignedIn) {
    return (
      <div className="dashboard">
        <div className="dashboard-inner">
          <div className="dashboard-signedout">
            Sign in to view your saved news.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-inner">
          <div className="dashboard-loading">Loading saved news...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-inner">
        <div className="dashboard-preferences">
          <div className="dashboard-header">
            <div>
              <h2 className="dashboard-title">Personalization</h2>
              <p className="dashboard-subtitle">
                Tune your feed with topics, sources, and keywords.
              </p>
            </div>
          </div>

          <form className="dashboard-pref-card" onSubmit={updatePreferences}>
            <div className="pref-group">
              <label>Preferred Categories</label>
              <div className="pref-tags">
                {categories.map((category) => {
                  const active = preferences.preferredCategories.includes(
                    category
                  );
                  return (
                    <button
                      key={category}
                      type="button"
                      className={`pref-tag ${active ? "active" : ""}`}
                      onClick={() => {
                        setPreferences((prev) => ({
                          ...prev,
                          preferredCategories: active
                            ? prev.preferredCategories.filter(
                                (item) => item !== category
                              )
                            : [...prev.preferredCategories, category],
                        }));
                      }}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pref-group">
              <label>Preferred Sources (comma separated)</label>
              <input
                value={preferences.preferredSources.join(", ")}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    preferredSources: e.target.value
                      .split(",")
                      .map((item) => item.trim().toLowerCase())
                      .filter(Boolean),
                  }))
                }
                placeholder="bbc, cnn, reuters"
              />
            </div>

            <div className="pref-group">
              <label>Keywords</label>
              <input
                value={preferences.keywords.join(", ")}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    keywords: e.target.value
                      .split(",")
                      .map((item) => item.trim().toLowerCase())
                      .filter(Boolean),
                  }))
                }
                placeholder="ai, startups, africa"
              />
            </div>

            <button className="dashboard-btn" type="submit">
              {prefStatus === "saving"
                ? "Saving..."
                : prefStatus === "saved"
                ? "Saved"
                : prefStatus === "error"
                ? "Try again"
                : "Save preferences"}
            </button>
          </form>
        </div>

        <div className="dashboard-header">
          <div>
            <h2 className="dashboard-title">Saved News</h2>
            <p className="dashboard-subtitle">Your bookmarked articles.</p>
          </div>

          <div className="dashboard-pill">
            <span className="dashboard-pill-dot" />
            {savedItems.length} saved
          </div>
        </div>

        <div className="dashboard-card">
          {savedItems.length === 0 ? (
            <div className="dashboard-empty">No saved articles yet.</div>
          ) : (
            <ul className="dashboard-list">
              {savedItems.map((item) => {
                const news = item?.newsId;
                const newsId = news?._id || news?.id || item?.newsId;
                const readAt = item?.readAt;

                return (
                  <li className="dashboard-item" key={item?._id || newsId}>
                    <div className="dashboard-thumb">
                      {news?.image ? (
                        <img src={news.image} alt={news?.title || "News"} />
                      ) : null}
                    </div>

                    <div className="dashboard-item-main">
                      <Link
                        className="dashboard-item-title"
                        to={`/news/${newsId}`}
                      >
                        {news?.title || "Untitled"}
                      </Link>

                      <div className="dashboard-item-meta">
                        {news?.url ? (
                          <a
                            className="dashboard-item-link"
                            href={news.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open source{" "}
                            <span className="dashboard-item-link-arrow">→</span>
                          </a>
                        ) : null}
                      </div>

                      <div className="dashboard-item-tags">
                        {item?.tag ? (
                          <span className="dashboard-chip">{item.tag}</span>
                        ) : null}
                        <span className="dashboard-chip muted">
                          {item?.priority || "normal"}
                        </span>
                        {readAt ? (
                          <span className="dashboard-chip success">Read</span>
                        ) : (
                          <span className="dashboard-chip">Unread</span>
                        )}
                      </div>
                    </div>

                    <div className="dashboard-actions">
                      <button
                        className="dashboard-btn"
                        onClick={() =>
                          updateSavedItem(newsId, {
                            readAt: readAt ? null : new Date().toISOString(),
                          })
                        }
                        disabled={updatingId === newsId}
                      >
                        {readAt ? "Mark unread" : "Mark read"}
                      </button>
                      <select
                        className="dashboard-select"
                        value={item?.priority || "normal"}
                        onChange={(e) =>
                          updateSavedItem(newsId, {
                            priority: e.target.value,
                          })
                        }
                        disabled={updatingId === newsId}
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                      </select>
                      <button
                        className="dashboard-btn remove"
                        onClick={() => removeSaved(newsId)}
                        disabled={removingId === newsId}
                      >
                        {removingId === newsId ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
