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

  // Comments State
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentPosting, setCommentPosting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if news is saved
  useEffect(() => {
    const checkSaved = async () => {
      if (!isSignedIn || !id) return;
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/news/saved-news/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setSaved(!!json);
        }
      } catch (e) {
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
      const method = saved ? "DELETE" : "POST";
      const res = await fetch(`${API_URL}/api/news/saved-news/${id}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSaved(method === "POST");
    } finally {
      setSaveLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!id) return;
    setCommentsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/news/${id}/comments?limit=50`);
      const json = await res.json();
      setComments(Array.isArray(json?.items) ? json.items : []);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [id]);

  const postComment = async (e) => {
    e?.preventDefault();
    if (!isSignedIn || !id || commentPosting || !commentText.trim()) return;

    setCommentPosting(true);
    const optimisticId = `opt-${Date.now()}`;
    const optimistic = {
      _id: optimisticId,
      text: commentText,
      createdAt: new Date().toISOString(),
      user: { firstName: user.firstName, imageUrl: user.imageUrl },
      __optimistic: true,
    };

    setComments((prev) => [optimistic, ...prev]);
    setCommentText("");

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/news/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: optimistic.text }),
      });
      if (!res.ok) throw new Error();
      fetchComments();
    } catch {
      setComments((prev) => prev.filter((c) => c._id !== optimisticId));
    } finally {
      setCommentPosting(false);
    }
  };

  if (isLoading)
    return (
      <div className="news-details-loader">
        <span>Loading Story</span>
      </div>
    );

  const bodyText = data?.summary || data?.text;

  return (
    <div className="container">
      <main className={`news-details ${mounted ? "is-active" : ""}`}>
        <div className="news-details-container">
          {/* Editorial Header */}
          <header className="article-header">
            <div className="article-meta">
              <span className="article-source">
                {data?.source || "Global News"}
              </span>
              <span className="article-dot">•</span>
              <span className="article-category">
                {data?.category || "General"}
              </span>
            </div>

            <h1 className="article-title">{data?.title}</h1>

            <div className="article-toolbar">
              <div className="article-timestamp">
                {data?.date
                  ? new Date(data.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Recently published"}
              </div>
              <button
                className={`article-save-btn ${saved ? "is-saved" : ""}`}
                onClick={toggleSave}
                disabled={!isSignedIn || saveLoading}
              >
                {saved ? "Saved" : "Save Article"}
              </button>
            </div>
          </header>

          {/* Cinematic Hero */}
          {data?.image && (
            <figure className="article-hero">
              <img src={data.image} alt={data.title} />
            </figure>
          )}

          {/* Narrative Body */}
          <article className="article-content">
            <p className="article-text">{bodyText}</p>

            {data?.url && (
              <div className="article-footer-cta">
                <a
                  href={data.url}
                  target="_blank"
                  rel="noreferrer"
                  className="external-link"
                >
                  Read full coverage at source ↗
                </a>
              </div>
            )}
          </article>

          {/* Premium Comments Section */}
          <section className="article-comments">
            <div className="comments-header">
              <h2>Discussions ({comments.length})</h2>
              <button onClick={fetchComments} className="refresh-btn">
                Refresh
              </button>
            </div>

            {isSignedIn ? (
              <form className="comment-form" onSubmit={postComment}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Join the conversation..."
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={commentPosting || !commentText.trim()}
                >
                  {commentPosting ? "Posting..." : "Post Comment"}
                </button>
              </form>
            ) : (
              <div className="comment-gate">
                Please sign in to participate in the discussion.
              </div>
            )}

            <div className="comments-feed">
              {comments.map((c) => (
                <div
                  key={c._id}
                  className={`comment-card ${
                    c.__optimistic ? "is-pending" : ""
                  }`}
                >
                  <img
                    src={c?.user?.imageUrl}
                    alt=""
                    className="comment-avatar"
                  />
                  <div className="comment-body">
                    <div className="comment-meta">
                      <span className="comment-author">
                        {c?.user?.firstName || "Anonymous"}
                      </span>
                      <span className="comment-date">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="comment-text">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default NewsDetails;
