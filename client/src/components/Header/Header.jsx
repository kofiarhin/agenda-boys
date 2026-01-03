// client/src/components/Header.jsx
import { useEffect, useState } from "react";
import "./header.styles.scss";
import { Link } from "react-router-dom";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`news-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="news-main">
        <div className="news-container news-main-inner">
          <a className="news-brand" href="/">
            <span className="news-brand-text">
              <span className="news-brand-title">AgendaBoys</span>
              <span className="news-brand-sub">
                See every side of every story
              </span>
            </span>
          </a>

          <div className="news-actions">
            <Link to="/" className="news-btn news-btn-ghost" href="/login">
              Home
            </Link>
            <Link
              to="/latest"
              className="news-btn news-btn-ghost"
              href="/login"
            >
              Latest
            </Link>
            <Link to="/login" className="news-btn news-btn-ghost" href="/login">
              Login
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
