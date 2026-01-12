// NewsDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import useNewsDetails from "../../hooks/useNewsDetails";
import "./news-details.styles.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const NewsDetails = () => {
  const { id } = useParams();
  const { data, isLoading, isError } = useNewsDetails(id);

  const { getToken } = useAuth();
  const { isSignedIn } = useUser();

  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const checkSaved = async () => {
      if (!isSignedIn || !id) return setSaved(false);

      try {
        const token = await getToken();
        if (!token) return setSaved(false);

        const res = await fetch(`${API_URL}/api/news/saved-news/${id}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return setSaved(false);

        const json = await res.json(); // doc or null
        setSaved(!!json);
      } catch {
        setSaved(false);
      }
    };

    checkSaved();
  }, [id, isSignedIn, getToken]);

  const toggleSave = async () => {
    if (!isSignedIn || !id || saveLoading) return;

    setSaveLoading(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("No token");

      const method = saved ? "DELETE" : "POST";

      const res = await fetch(`${API_URL}/api/news/saved-news/${id}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Request failed");

      setSaved(method === "POST");
    } catch (e) {
      // no-op
    } finally {
      setSaveLoading(false);
    }
  };

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

          <button
            type="button"
            className={`news-details-save-btn ${saved ? "is-saved" : ""}`}
            onClick={toggleSave}
            disabled={!isSignedIn || saveLoading}
            aria-pressed={saved}
            aria-busy={saveLoading}
            title={!isSignedIn ? "Sign in to save" : saved ? "Remove" : "Save"}
          >
            {!isSignedIn
              ? "Sign in to save"
              : saveLoading
              ? "Saving..."
              : saved
              ? "Remove"
              : "Save"}
          </button>
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
