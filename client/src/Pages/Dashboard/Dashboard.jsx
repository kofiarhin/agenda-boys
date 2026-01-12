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
                    </div>

                    <div className="dashboard-actions">
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
