import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import "./community.styles.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Community = () => {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/posts`);
      const json = await res.json();
      setPosts(Array.isArray(json?.items) ? json.items : []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const submitPost = async (e) => {
    e.preventDefault();
    if (!isSignedIn || submitting || !content.trim()) return;

    setSubmitting(true);

    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (res.ok) {
        setContent("");
        fetchPosts();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="community">
      <div className="community-inner">
        <header className="community-header">
          <div>
            <h2>Community Feed</h2>
            <p>Share reactions, takes, and quick updates.</p>
          </div>
          <button type="button" onClick={fetchPosts} className="refresh">
            Refresh
          </button>
        </header>

        {isSignedIn ? (
          <form className="community-form" onSubmit={submitPost}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Drop your take (280 chars max)..."
              maxLength={280}
            />
            <button type="submit" disabled={submitting || !content.trim()}>
              {submitting ? "Posting..." : "Post"}
            </button>
          </form>
        ) : (
          <div className="community-gate">
            Sign in to post in the community.
          </div>
        )}

        <div className="community-feed">
          {loading ? (
            <div className="community-loading">Loading posts...</div>
          ) : posts.length ? (
            posts.map((post) => (
              <article key={post._id} className="community-card">
                <div className="community-meta">
                  <span className="pill">Community</span>
                  <span className="time">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p>{post.content}</p>
              </article>
            ))
          ) : (
            <div className="community-empty">No posts yet.</div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Community;
