// client/pages/Dashboard.jsx
import React, { useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import "./dashboard.styles.scss";
import NewsList from "../../components/NewsList/NewsList";
import useSavedArticles from "../../hooks/useSavedArticles";

const Dashboard = () => {
  const { user, isLoaded, isSignedIn } = useUser();

  const { data, isLoading, error } = useSavedArticles();

  const ui = useMemo(() => {
    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    const fullName =
      user?.fullName || `${firstName} ${lastName}`.trim() || "Reader";
    const email = user?.primaryEmailAddress?.emailAddress || "";
    const avatar = user?.imageUrl || "";

    return { fullName, email, avatar };
  }, [user]);

  if (!isLoaded) return null;
  if (!isSignedIn) return null;

  const articles = data?.articles || data || [];

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-grid">
          <aside className="dashboard-sidebar">
            <div className="dashboard-user-card">
              <img
                className="dashboard-avatar"
                src={ui.avatar}
                alt={ui.fullName}
              />
              <div className="dashboard-user-meta">
                <div className="dashboard-user-name">
                  Welcome, {ui.fullName}
                </div>
                <div className="dashboard-user-email">{ui.email}</div>
              </div>
            </div>
          </aside>

          <main className="dashboard-main">
            <section className="dashboard-section">
              <div className="dashboard-section-head">
                <div className="dashboard-section-title">Saved articles</div>
              </div>

              {isLoading && <div className="dashboard-muted">Loading…</div>}
              {error && (
                <div className="dashboard-muted">
                  Failed to load saved articles.
                </div>
              )}

              {!isLoading && !error && articles.length === 0 && (
                <div className="dashboard-muted">No saved articles yet.</div>
              )}

              {!isLoading && !error && articles.length > 0 && (
                <NewsList data={articles} />
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
