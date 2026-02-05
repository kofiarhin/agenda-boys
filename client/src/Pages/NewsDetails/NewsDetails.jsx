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
  const [upvotingId, setUpvotingId] = useState(null);
  const [reportingId, setReportingId] = useState(null);

  useEffect(() => setMounted(true), []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      user: {
        clerkId: user?.id,
        firstName: user?.firstName,
        imageUrl: user?.imageUrl,
      },
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

  const upvoteComment = async (commentId) => {
    if (!isSignedIn || !id || !commentId || upvotingId) return;

    setUpvotingId(commentId);
    try {
      const token = await getToken();
      const res = await fetch(
        `${API_URL}/api/news/${id}/comments/${commentId}/upvote`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Upvote failed");

      const data = await res.json();
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? { ...c, upvoteCount: data?.upvoteCount || 0 }
            : c
        )
      );
    } finally {
      setUpvotingId(null);
    }
  };

  const reportComment = async (commentId) => {
    if (!isSignedIn || !id || !commentId || reportingId) return;

    setReportingId(commentId);
    try {
      const token = await getToken();
      const res = await fetch(
        `${API_URL}/api/news/${id}/comments/${commentId}/report`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Report failed");

      const data = await res.json();
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? { ...c, reportCount: data?.reportCount || 0 }
            : c
        )
      );
    } finally {
      setReportingId(null);
    }
  };

  // ✅ DELETE COMMENT (fix)
  const deleteComment = async (commentId) => {
    if (!isSignedIn || !id || !commentId || deletingId) return;

    const prev = comments;
    setDeletingId(commentId);

    // optimistic remove
    setComments((curr) => curr.filter((c) => c._id !== commentId));

    try {
      const token = await getToken();

      // supports either route style:
      // 1) /api/news/:newsId/comments/:commentId
      // 2) /api/news/comments/:commentId?newsId=:newsId
      let res = await fetch(`${API_URL}/api/news/${id}/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        res = await fetch(
          `${API_URL}/api/news/comments/${commentId}?newsId=${id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      if (!res.ok) throw new Error("Delete failed");
      // optional: refetch to ensure server truth
      fetchComments();
    } catch {
      // rollback
      setComments(prev);
    } finally {
      setDeletingId(null);
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

          {data?.image && (
            <figure className="article-hero">
              <img src={data.image} alt={data.title} />
            </figure>
          )}

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
              {commentsLoading ? (
                <div className="comments-loading">Loading comments...</div>
              ) : (
                comments.map((c) => {
                  const isOwner =
                    isSignedIn &&
                    (c?.user?.clerkId === user?.id ||
                      c?.userId === user?.id ||
                      c?.clerkId === user?.id);

                  return (
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

                          {/* ✅ delete button */}
                          {isOwner && !c.__optimistic && (
                            <button
                              type="button"
                              className="comment-delete-btn"
                              onClick={() => deleteComment(c._id)}
                              disabled={deletingId === c._id}
                              title="Delete comment"
                            >
                              {deletingId === c._id ? "Deleting..." : "Delete"}
                            </button>
                          )}
                        </div>

                        <p className="comment-text">{c.text}</p>

                        <div className="comment-actions">
                          <button
                            type="button"
                            onClick={() => upvoteComment(c._id)}
                            disabled={upvotingId === c._id || !isSignedIn}
                          >
                            👍 {c?.upvoteCount || 0}
                          </button>
                          <button
                            type="button"
                            onClick={() => reportComment(c._id)}
                            disabled={reportingId === c._id || !isSignedIn}
                          >
                            {reportingId === c._id ? "Reporting..." : "Report"}
                          </button>
                          {c?.isPinned ? (
                            <span className="comment-pinned">Pinned</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default NewsDetails;
