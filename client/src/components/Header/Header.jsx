// client/src/components/Header.jsx
import { useEffect, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import "./header.styles.scss";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const getLinkClass = ({ isActive }) =>
    `header-link ${isActive ? "is-active" : ""}`;

  return (
    <header className={`header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="header-inner">
        <Link to="/" className="header-brand" aria-label="AgendaBoys home">
          <span className="header-brand-block">
            <span className="header-brand-title">AgendaBoys</span>
            <span className="header-brand-slug">
              See every side of every story
            </span>
          </span>
        </Link>

        <nav className="header-nav" aria-label="Primary">
          <NavLink to="/" className={getLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/news" className={getLinkClass}>
            News
          </NavLink>

          <NavLink to="/news?topic=national" className={getLinkClass}>
            National
          </NavLink>
          <NavLink to="/news?topic=politics" className={getLinkClass}>
            Politics
          </NavLink>
          <NavLink to="/news?topic=business" className={getLinkClass}>
            Business
          </NavLink>
        </nav>

        <button
          type="button"
          className="header-burger"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span
            className={`burger-lines ${menuOpen ? "is-open" : ""}`}
            aria-hidden="true"
          >
            <span className="burger-line" />
            <span className="burger-line" />
            <span className="burger-line" />
          </span>
        </button>
      </div>

      <div
        className={`header-backdrop ${menuOpen ? "is-open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

      <aside
        id="mobile-menu"
        className={`header-menu ${menuOpen ? "is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="header-menu-top">
          <span className="header-menu-title">Menu</span>
          <button
            type="button"
            className="header-menu-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <div className="header-menu-links">
          <NavLink to="/" className={getLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/news" className={getLinkClass}>
            News
          </NavLink>
          <NavLink to="/news?topic=politics" className={getLinkClass}>
            Politics
          </NavLink>
          <NavLink to="/news?topic=business" className={getLinkClass}>
            Business
          </NavLink>
        </div>
      </aside>
    </header>
  );
};

export default Header;
