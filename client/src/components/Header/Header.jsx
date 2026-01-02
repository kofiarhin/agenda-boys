// client/src/components/Header.jsx
import { useEffect, useState } from "react";
import "./header.styles.scss";

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
            <span className="news-brand-mark" aria-hidden="true">
              AB
            </span>
            <span className="news-brand-text">
              <span className="news-brand-title">AgendaBoys</span>
              <span className="news-brand-sub">Lets shape the narrative</span>
            </span>
          </a>

          <nav className="news-nav" aria-label="Primary">
            <a className="news-nav-link is-active" href="/" aria-current="page">
              Home
            </a>
            <a className="news-nav-link" href="/latest">
              Latest
            </a>
          </nav>

          <div className="news-actions">
            <a className="news-btn news-btn-primary" href="/latest">
              Read now <span aria-hidden="true">↗</span>
            </a>
            <a className="news-btn news-btn-ghost" href="/login">
              Login
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
