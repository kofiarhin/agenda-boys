// NewsDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import useNewsDetails from "../../hooks/useNewsDetails";
import "./news-details.styles.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const NewsDetails = () => {
  const { id } = useParams();
  const { data, isLoading, isError } = useNewsDetails(id);

  const { getToken } = useAuth();
  const { isSignedIn, user } = useUser();

  const clerkId = useMemo(() => user?.id || null, [user]);

  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [commentPosting, setCommentPosting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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

        const json = await res.json();
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

  const fetchComments = async () => {
    if (!id) return;

    setCommentsLoading(true);
    setCommentsError(false);

    try {
      const res = await fetch(`${API_URL}/api/news/${id}/comments?limit=50`, {
        method: "GET",
      });

      if (!res.ok) throw new Error("Failed");

      const json = await res.json(); // { items: [] }
      setComments(Array.isArray(json?.items) ? json.items : []);
    } catch (e) {
      setCommentsError(true);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const postComment = async (e) => {
    e?.preventDefault?.();
    if (!isSignedIn || !id || commentPosting) return;

    const text = commentText.trim();
    if (!text) return;

    setCommentPosting(true);

    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic = {
      _id: optimisticId,
      newsId: id,
      clerkId: clerkId || "",
      text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        imageUrl: user?.imageUrl || "",
      },
      __optimistic: true,
    };

    setComments((prev) => [optimistic, ...prev]);
    setCommentText("");

    try {
      const token = await getToken();
      if (!token) throw new Error("No token");

      const res = await fetch(`${API_URL}/api/news/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error("Failed");

      const json = await res.json(); // { item }
      const savedItem = json?.item;

      if (savedItem?._id) {
        setComments((prev) => [
          savedItem,
          ...prev.filter((c) => c._id !== optimisticId),
        ]);
      } else {
        setComments((prev) => prev.filter((c) => c._id !== optimisticId));
        fetchComments();
      }
    } catch (e2) {
      setComments((prev) => prev.filter((c) => c._id !== optimisticId));
    } finally {
      setCommentPosting(false);
    }
  };

  const removeComment = async (commentId) => {
    if (!isSignedIn || !id || !commentId || deletingId) return;

    setDeletingId(commentId);

    const prev = comments;
    setComments((curr) => curr.filter((c) => c._id !== commentId));

    try {
      const token = await getToken();
      if (!token) throw new Error("No token");

      const res = await fetch(
        `${API_URL}/api/news/${id}/comments/${commentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed");
    } catch (e) {
      setComments(prev);
    } finally {
      setDeletingId(null);
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

        {/* COMMENTS */}
        <section className="news-details-comments">
          <div className="news-details-comments-header">
            <h2 className="news-details-comments-title">Comments</h2>
            <button
              type="button"
              className="news-details-comments-refresh"
              onClick={fetchComments}
              disabled={commentsLoading}
              aria-busy={commentsLoading}
            >
              {commentsLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {!isSignedIn ? (
            <p className="news-details-comments-hint">Sign in to comment.</p>
          ) : (
            <form className="news-details-comment-form" onSubmit={postComment}>
              <textarea
                className="news-details-comment-input"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                maxLength={500}
                rows={3}
                disabled={commentPosting}
              />
              <div className="news-details-comment-actions">
                <span className="news-details-comment-count">
                  {commentText.trim().length}/500
                </span>
                <button
                  type="submit"
                  className="news-details-comment-btn"
                  disabled={commentPosting || !commentText.trim()}
                  aria-busy={commentPosting}
                >
                  {commentPosting ? "Posting..." : "Post"}
                </button>
              </div>
            </form>
          )}

          {commentsError ? (
            <p className="news-details-comments-error">
              Failed to load comments.
            </p>
          ) : null}

          {!commentsLoading && !commentsError && comments.length === 0 ? (
            <p className="news-details-comments-empty">No comments yet.</p>
          ) : null}

          <div className="news-details-comments-list">
            {comments.map((c) => {
              const name = `${c?.user?.firstName || ""} ${
                c?.user?.lastName || ""
              }`.trim();

              const isOwner = !!clerkId && c?.clerkId === clerkId;
              const isOptimistic = !!c?.__optimistic;

              return (
                <div
                  key={c._id}
                  className={`news-details-comment ${
                    isOptimistic ? "is-optimistic" : ""
                  }`}
                >
                  <div className="news-details-comment-left">
                    {c?.user?.imageUrl ? (
                      <img
                        className="news-details-comment-avatar"
                        src={c.user.imageUrl}
                        alt={name || "User"}
                        loading="lazy"
                      />
                    ) : (
                      <div className="news-details-comment-avatar-fallback" />
                    )}
                  </div>

                  <div className="news-details-comment-right">
                    <div className="news-details-comment-meta">
                      <span className="news-details-comment-name">
                        {name || "User"}
                      </span>
                      <span className="news-details-comment-dot">•</span>
                      <time
                        className="news-details-comment-time"
                        dateTime={c?.createdAt}
                      >
                        {c?.createdAt
                          ? new Date(c.createdAt).toLocaleString()
                          : ""}
                      </time>

                      {isOwner ? (
                        <button
                          type="button"
                          className="news-details-comment-delete"
                          onClick={() => removeComment(c._id)}
                          disabled={deletingId === c._id || isOptimistic}
                          aria-busy={deletingId === c._id}
                          title="Delete"
                        >
                          {deletingId === c._id ? "Deleting..." : "Delete"}
                        </button>
                      ) : null}
                    </div>

                    <p className="news-details-comment-text">{c?.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

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
