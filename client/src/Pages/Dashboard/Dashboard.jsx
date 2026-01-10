// client/Pages/Dashboard/Dashboard.jsx
import React, { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import "./dashboard.styles.scss";

const Dashboard = () => {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to="/login" replace />;

  const displayName =
    user?.firstName ||
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "User";

  const email = user?.primaryEmailAddress?.emailAddress || "";
  const avatarUrl = user?.imageUrl || "";

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const [query, setQuery] = useState("");
  const [active, setActive] = useState("For you");

  const filters = useMemo(
    () => ["For you", "Top", "Local", "Politics", "Business", "Tech", "Sports"],
    []
  );

  const stats = useMemo(
    () => [
      { label: "New today", value: 12 },
      { label: "Unread", value: 27 },
      { label: "Saved", value: 18 },
      { label: "Sources", value: 5 },
    ],
    []
  );

  const digest = useMemo(
    () => [
      {
        id: "6961f212e34a44bda8b90336",
        title:
          "NPP Election Committee confers with Akufo-Addo as road to presidential primaries intensifies",
        source: "MyJoyOnline",
        category: "Politics",
        time: "10 Jan 2026 · 06:30",
        excerpt:
          "The New Patriotic Party (NPP) Presidential Elections Committee held a high-stakes consultative meeting with former President Nana Addo...",
        image:
          "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=60",
      },
      {
        id: "a2",
        title: "Markets react to inflation data as rate expectations shift",
        source: "Reuters",
        category: "Business",
        time: "10 Jan 2026 · 07:10",
        excerpt:
          "Investors reprice risk across major sectors as the latest figures reshape the near-term outlook...",
        image:
          "https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1200&q=60",
      },
      {
        id: "a3",
        title: "AI tools move from hype to workflows inside small teams",
        source: "The Verge",
        category: "Tech",
        time: "10 Jan 2026 · 08:02",
        excerpt:
          "Builders are consolidating tools, using fewer apps, and leaning into automations to reduce context switching...",
        image:
          "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=60",
      },
    ],
    []
  );

  const readingList = useMemo(
    () => [
      {
        id: "b1",
        title:
          "Dumelo targets total road coverage for Ayawaso West Wuogon by 2028",
        source: "MyJoyOnline",
        category: "Politics",
        time: "10 Jan 2026 · 06:30",
      },
      {
        id: "b2",
        title: "Startup playbook: monetization strategies creators can copy",
        source: "TechCrunch",
        category: "Business",
        time: "10 Jan 2026 · 09:15",
      },
      {
        id: "b3",
        title: "Sports desk: squad announcement ahead of qualifiers",
        source: "BBC",
        category: "Sports",
        time: "10 Jan 2026 · 10:20",
      },
      {
        id: "b4",
        title: "Local: traffic + fuel price update you should know",
        source: "BBC",
        category: "Local",
        time: "10 Jan 2026 · 11:05",
      },
    ],
    []
  );

  const sources = useMemo(
    () => [
      { name: "MyJoyOnline", count: 61 },
      { name: "BBC", count: 44 },
      { name: "Reuters", count: 38 },
      { name: "The Verge", count: 29 },
      { name: "TechCrunch", count: 36 },
    ],
    []
  );

  const filteredList = useMemo(() => {
    const q = query.trim().toLowerCase();
    return readingList.filter((x) => {
      if (!q) return true;
      return (
        x.title.toLowerCase().includes(q) ||
        x.source.toLowerCase().includes(q) ||
        x.category.toLowerCase().includes(q)
      );
    });
  }, [readingList, query]);

  return (
    <div className="dash">
      <div className="dash-shell">
        <div className="dash-top">
          <div className="dash-title-block">
            <div className="dash-title">
              {getGreeting()}, {displayName}
            </div>
            <div className="dash-sub">
              Morning brief, quick saves, and what’s trending in your feed.
            </div>
          </div>

          <div className="dash-actions">
            <div className="dash-search">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your feed..."
                className="dash-search-input"
              />
              <span className="dash-search-kbd">⌘K</span>
            </div>
            <button className="dash-btn">Preferences</button>
            <button className="dash-btn primary">New digest</button>
          </div>
        </div>

        <div className="dash-grid">
          <main className="dash-main">
            <div className="dash-card hero">
              <div className="hero-left">
                <div className="hero-pill">
                  <span className="dot" />
                  Live briefing
                </div>

                <div className="hero-head">
                  <div className="hero-note">
                    You have <span className="hi">12</span> new stories and{" "}
                    <span className="hi">4</span> breaking updates since last
                    visit.
                  </div>
                </div>

                <div className="hero-filters">
                  {filters.map((f) => (
                    <button
                      key={f}
                      className={`chip ${active === f ? "active" : ""}`}
                      onClick={() => setActive(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="hero-stats">
                  {stats.map((s) => (
                    <div className="stat" key={s.label}>
                      <div className="stat-val">{s.value}</div>
                      <div className="stat-lbl">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="hero-ctas">
                  <button className="dash-btn primary">Continue reading</button>
                  <button className="dash-btn ghost">View saved</button>
                </div>
              </div>

              <div className="hero-right">
                <div className="hero-stack">
                  {digest.map((a) => (
                    <Link
                      to={`/news/${a.id}`}
                      className="hero-article"
                      key={a.id}
                    >
                      <div className="hero-article-img">
                        <img src={a.image} alt="" loading="lazy" />
                      </div>
                      <div className="hero-article-body">
                        <div className="meta">
                          <span className="tag">{a.category}</span>
                          <span className="sep">•</span>
                          <span className="source">{a.source}</span>
                          <span className="sep">•</span>
                          <span className="time">{a.time}</span>
                        </div>
                        <div className="headline">{a.title}</div>
                        <div className="excerpt">{a.excerpt}</div>
                        <div className="hero-article-foot">
                          <button
                            className="icon-btn"
                            onClick={(e) => e.preventDefault()}
                            title="Save"
                          >
                            ★
                          </button>
                          <button
                            className="icon-btn"
                            onClick={(e) => e.preventDefault()}
                            title="Open"
                          >
                            ↗
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="dash-row">
              <div className="dash-card">
                <div className="card-head">
                  <div className="card-title">Reading list</div>
                  <div className="card-sub">
                    Fast picks based on your sources
                  </div>
                </div>

                <div className="list">
                  {filteredList.map((x) => (
                    <Link to={`/news/${x.id}`} className="list-item" key={x.id}>
                      <div className="list-left">
                        <div className="list-title">{x.title}</div>
                        <div className="list-meta">
                          <span className="pill">{x.source}</span>
                          <span className="pill">{x.category}</span>
                          <span className="pill">{x.time}</span>
                        </div>
                      </div>
                      <div className="list-right">
                        <button
                          className="mini ghost"
                          onClick={(e) => e.preventDefault()}
                        >
                          Save
                        </button>
                        <button
                          className="mini primary"
                          onClick={(e) => e.preventDefault()}
                        >
                          Open
                        </button>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="dash-card">
                <div className="card-head">
                  <div className="card-title">Your sources</div>
                  <div className="card-sub">
                    Followed sources and story volume
                  </div>
                </div>

                <div className="sources">
                  {sources.map((s) => (
                    <div className="source-row" key={s.name}>
                      <div className="source-name">{s.name}</div>
                      <div className="source-bar">
                        <div
                          className="fill"
                          style={{
                            width: `${Math.min(100, (s.count / 70) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="source-count">{s.count}</div>
                    </div>
                  ))}
                </div>

                <div className="source-actions">
                  <button className="dash-btn ghost">Manage sources</button>
                  <button className="dash-btn">Add source</button>
                </div>
              </div>
            </div>
          </main>

          <aside className="dash-aside">
            <div className="dash-card aside-card">
              <div className="card-head">
                <div className="card-title">Profile</div>
                <div className="card-sub">Signed in as</div>
              </div>

              <div className="profile">
                <div className="avatar" aria-hidden>
                  {avatarUrl ? <img src={avatarUrl} alt="" /> : null}
                </div>
                <div className="profile-meta">
                  <div className="profile-name">{displayName}</div>
                  <div className="profile-email">{email}</div>
                </div>
              </div>

              <div className="profile-actions">
                <button className="dash-btn">Account</button>
                <button className="dash-btn ghost">Notifications</button>
              </div>
            </div>

            <div className="dash-card aside-card">
              <div className="card-head">
                <div className="card-title">Daily goal</div>
                <div className="card-sub">Keep the streak alive</div>
              </div>

              <div className="goal">
                <div className="goal-top">
                  <div className="goal-num">5 mins</div>
                  <div className="goal-sub">Recommended reading</div>
                </div>
                <div className="progress">
                  <div className="progress-fill" style={{ width: "62%" }} />
                </div>
                <div className="goal-foot">
                  <span className="muted">3m done</span>
                  <span className="muted">2m left</span>
                </div>
                <button className="wide primary">Continue</button>
              </div>
            </div>

            <div className="dash-card aside-card">
              <div className="card-head">
                <div className="card-title">Quick actions</div>
                <div className="card-sub">One tap workflows</div>
              </div>

              <div className="quick">
                <button className="quick-btn">+ Add category</button>
                <button className="quick-btn">+ Add source</button>
                <button className="quick-btn ghost">View saved</button>
                <button className="quick-btn ghost">Read later</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
