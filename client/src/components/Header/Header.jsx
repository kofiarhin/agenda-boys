import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import "./header.styles.scss";

const Header = () => {
  const [isCompact, setIsCompact] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsCompact(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => setIsMenuOpen(false), [location]);

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
        <Link to="/" className="ab-logo-group">
          <div className="ab-logo-main">
            agendaboys<span>.</span>
          </div>
          <div className="ab-live-tag">
            <span className="dot" /> LIVE
          </div>
        </Link>

        <nav className="ab-desktop-nav">
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

        <div className="ab-utility">
          <SignedIn>
            <div className="ab-user-box">
              <Link to="/dashboard" className="ab-dash-link">
                Dashboard
              </Link>
              <UserButton
                appearance={{ elements: { userButtonAvatarBox: "ab-avatar" } }}
              />
            </div>
          </SignedIn>

          <SignedOut>
            <Link to="/login" className="ab-auth-btn">
              Access
            </Link>
          </SignedOut>

          <button
            className="ab-trigger"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="bar" />
            <div className="bar" />
          </button>
        </div>
      </div>

      <div className={`ab-menu-overlay ${isMenuOpen ? "visible" : ""}`}>
        <div className="ab-menu-inner">
          <div className="ab-menu-grid">
            <div className="ab-menu-col">
              <p className="ab-label">Navigation</p>
              {navLinks.map((link, i) => (
                <Link
                  key={i}
                  to={link.path}
                  className={`ab-menu-link ${
                    isActiveLink(link.path) ? "active" : ""
                  }`}
                  style={{ "--i": i }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
