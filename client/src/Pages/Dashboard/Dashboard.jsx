// client/pages/Dashboard.jsx
import React, { useMemo } from "react";
import { useUser, SignOutButton } from "@clerk/clerk-react";
import "./dashboard.styles.scss";

const Dashboard = () => {
  const { user, isLoaded, isSignedIn } = useUser();

  const ui = useMemo(() => {
    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    const fullName =
      user?.fullName || `${firstName} ${lastName}`.trim() || "Reader";
    const email = user?.primaryEmailAddress?.emailAddress || "";
    const avatar = user?.imageUrl || "";

    const categories = ["Tech", "Business", "AI", "World", "Sports", "Design"];
    const sources = ["BBC", "The Verge", "Reuters", "FT", "TechCrunch"];
    const topStories = [
      {
        id: "1",
        title: "AI chips surge as new model releases drive demand",
        source: "Reuters",
        time: "12m ago",
        tag: "AI",
      },
      {
        id: "2",
        title: "Productivity tools are shifting: fewer apps, more workflows",
        source: "The Verge",
        time: "1h ago",
        tag: "Tech",
      },
      {
        id: "3",
        title: "Markets open mixed as investors watch inflation signals",
        source: "FT",
        time: "2h ago",
        tag: "Business",
      },
      {
        id: "4",
        title: "Design systems: why tokens are becoming the default language",
        source: "Smashing",
        time: "3h ago",
        tag: "Design",
      },
    ];

    const stats = [
      { label: "Saved", value: 18 },
      { label: "Sources", value: sources.length },
      { label: "Categories", value: categories.length },
      { label: "Read today", value: 7 },
    ];

    return { fullName, email, avatar, categories, sources, topStories, stats };
  }, [user]);

  if (!isLoaded) return null;
  if (!isSignedIn) return null;

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-topbar">
          <div className="dashboard-brand">
            <div className="dashboard-logo">🗞️</div>
            <div className="dashboard-brand-text">
              <div className="dashboard-brand-name">NewsPulse</div>
              <div className="dashboard-brand-sub">
                Your personalised briefing
              </div>
            </div>
          </div>

          <div className="dashboard-top-actions">
            <button className="dashboard-btn dashboard-btn-ghost" type="button">
              Search
            </button>

            <button className="dashboard-btn dashboard-btn-ghost" type="button">
              Preferences
            </button>

            <SignOutButton>
              <button className="dashboard-btn" type="button">
                Sign out
              </button>
            </SignOutButton>
          </div>
        </header>

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

            <div className="dashboard-panel">
              <div className="dashboard-panel-title">Quick actions</div>
              <div className="dashboard-actions">
                <button className="dashboard-action" type="button">
                  + Add source
                </button>
                <button className="dashboard-action" type="button">
                  + Add category
                </button>
                <button className="dashboard-action" type="button">
                  View saved
                </button>
                <button className="dashboard-action" type="button">
                  Read later
                </button>
              </div>
            </div>

            <div className="dashboard-panel">
              <div className="dashboard-panel-title">Your sources</div>
              <div className="dashboard-chip-row">
                {ui.sources.map((s) => (
                  <span key={s} className="dashboard-chip">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="dashboard-panel">
              <div className="dashboard-panel-title">Your categories</div>
              <div className="dashboard-chip-row">
                {ui.categories.map((c) => (
                  <span key={c} className="dashboard-chip dashboard-chip-soft">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <main className="dashboard-main">
            <section className="dashboard-hero">
              <div className="dashboard-hero-left">
                <div className="dashboard-hero-title">Today’s Briefing</div>
                <div className="dashboard-hero-sub">
                  Top headlines tailored to your sources and categories.
                </div>

                <div className="dashboard-stats">
                  {ui.stats.map((s) => (
                    <div key={s.label} className="dashboard-stat">
                      <div className="dashboard-stat-value">{s.value}</div>
                      <div className="dashboard-stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dashboard-hero-right">
                <div className="dashboard-kpi-card">
                  <div className="dashboard-kpi-title">Reading streak</div>
                  <div className="dashboard-kpi-value">4 days</div>
                  <div className="dashboard-kpi-sub">
                    Keep it going — 5 mins a day.
                  </div>
                </div>

                <div className="dashboard-kpi-card dashboard-kpi-card-alt">
                  <div className="dashboard-kpi-title">New stories</div>
                  <div className="dashboard-kpi-value">12</div>
                  <div className="dashboard-kpi-sub">
                    Since your last visit.
                  </div>
                </div>
              </div>
            </section>

            <section className="dashboard-section">
              <div className="dashboard-section-head">
                <div className="dashboard-section-title">Top stories</div>
                <button
                  className="dashboard-btn dashboard-btn-ghost"
                  type="button"
                >
                  View all
                </button>
              </div>

              <div className="dashboard-cards">
                {ui.topStories.map((n) => (
                  <article key={n.id} className="dashboard-card">
                    <div className="dashboard-card-top">
                      <span className="dashboard-pill">{n.tag}</span>
                      <span className="dashboard-card-time">{n.time}</span>
                    </div>

                    <div className="dashboard-card-title">{n.title}</div>

                    <div className="dashboard-card-bottom">
                      <span className="dashboard-card-source">{n.source}</span>

                      <div className="dashboard-card-actions">
                        <button
                          className="dashboard-icon-btn"
                          type="button"
                          aria-label="Save"
                        >
                          ☆
                        </button>
                        <button
                          className="dashboard-icon-btn"
                          type="button"
                          aria-label="Open"
                        >
                          ↗
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="dashboard-section">
              <div className="dashboard-section-head">
                <div className="dashboard-section-title">For you</div>
                <div className="dashboard-muted">
                  Based on what you read and save.
                </div>
              </div>

              <div className="dashboard-empty">
                <div className="dashboard-empty-title">
                  Personalisation coming online
                </div>
                <div className="dashboard-empty-sub">
                  Once you start saving stories, this section learns your taste.
                </div>
                <button className="dashboard-btn" type="button">
                  Start exploring
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
