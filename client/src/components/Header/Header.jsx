// client/src/components/Header.jsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import "./header.styles.scss";

const Header = () => {
  const [isCompact, setIsCompact] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsCompact(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => setIsMenuOpen(false), [location]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const onKey = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isMenuOpen]);

  const navLinks = [
    { path: "/news", label: "News" },
    { path: "/news?topic=national", label: "National" },
    { path: "/news?topic=politics", label: "Politics" },
    { path: "/news?topic=business", label: "Business" },
    { path: "/news?topic=sports", label: "Sports" },
  ];

  const normalize = (url) => {
    const u = new URL(url, window.location.origin);
    const params = new URLSearchParams(u.search);
    const sorted = new URLSearchParams([...params.entries()].sort());
    return `${u.pathname}?${sorted.toString()}`.replace(/\?$/, "");
  };

  const isActiveLink = (path) => {
    const current = normalize(location.pathname + location.search);
    const target = normalize(path);
    return current === target;
  };

  return (
    <header
      className={`ab-header ${isCompact ? "is-compact" : ""} ${
        isMenuOpen ? "is-active" : ""
      }`}
    >
      <div className="ab-header-bar">
        <div className="ab-left">
          <Link to="/" className="ab-logo-group" aria-label="AgendaBoys home">
            <div className="ab-logo-main">
              agendaboys<span>.</span>
            </div>
            <div className="ab-live-tag" aria-label="Live">
              <span className="dot" />
              <span className="ab-live-text">LIVE</span>
            </div>
          </Link>
        </div>

        <nav className="ab-desktop-nav" aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={`ab-nav-link ${
                isActiveLink(link.path) ? "active" : ""
              }`}
              aria-current={isActiveLink(link.path) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ab-right">
          <div className="ab-actions">
            <SignedIn>
              <div className="ab-user-box">
                <Link to="/dashboard" className="ab-dash-link">
                  Dashboard
                </Link>
                <UserButton
                  appearance={{
                    elements: { userButtonAvatarBox: "ab-avatar" },
                  }}
                />
              </div>
            </SignedIn>

            <SignedOut>
              <Link to="/login" className="ab-auth-btn">
                Access
              </Link>
            </SignedOut>

            <button
              className={`ab-trigger ${isMenuOpen ? "is-open" : ""}`}
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="ab-mobile-menu"
              type="button"
            >
              <span className="bar" />
              <span className="bar" />
            </button>
          </div>
        </div>
      </div>

      <div
        id="ab-mobile-menu"
        className={`ab-menu-overlay ${isMenuOpen ? "visible" : ""}`}
        aria-hidden={!isMenuOpen}
      >
        <div
          className="ab-menu-backdrop"
          onClick={() => setIsMenuOpen(false)}
        />

        <div className="ab-menu-panel" role="dialog" aria-modal="true">
          <div className="ab-menu-top">
            <div className="ab-menu-brand">
              <div className="ab-menu-title">Menu</div>
              <div className="ab-menu-sub">Pick a section</div>
            </div>

            <button
              className="ab-menu-close"
              type="button"
              aria-label="Close menu"
              onClick={() => setIsMenuOpen(false)}
            >
              <span />
              <span />
            </button>
          </div>

          <div className="ab-menu-links">
            {navLinks.map((link, i) => (
              <Link
                key={i}
                to={link.path}
                className={`ab-menu-link ${
                  isActiveLink(link.path) ? "active" : ""
                }`}
                style={{ "--i": i }}
              >
                <span className="ab-menu-link-text">{link.label}</span>
                <span className="ab-menu-chevron" aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </div>

          <div className="ab-menu-footer">
            <SignedOut>
              <Link to="/login" className="ab-menu-cta">
                Access
              </Link>
            </SignedOut>

            <SignedIn>
              <Link to="/dashboard" className="ab-menu-cta">
                Dashboard
              </Link>
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
