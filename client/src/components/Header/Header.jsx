// client/src/components/Header.jsx
import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import "./header.styles.scss";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const menuRef = useRef(null);
  const firstLinkRef = useRef(null);
  const lastFocusedRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  // will remove this later
  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      if (
        lastFocusedRef.current &&
        typeof lastFocusedRef.current.focus === "function"
      ) {
        lastFocusedRef.current.focus();
      }
      return;
    }

    lastFocusedRef.current = document.activeElement;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
      if (e.key !== "Tab") return;

      const root = menuRef.current;
      if (!root) return;

      const focusables = root.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    requestAnimationFrame(() => {
      if (firstLinkRef.current) firstLinkRef.current.focus();
    });

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  // ✅ FIX: NavLink ignores querystring for active state, so we compute it ourselves
  const onNewsRoute = location.pathname.startsWith("/news");
  const currentTopic = new URLSearchParams(location.search).get("topic") || "";

  const linkClass = (active) => `header-link ${active ? "is-active" : ""}`;
  const drawerLinkClass = (active) =>
    `header-drawer-link ${active ? "is-active" : ""}`;

  return (
    <header className={`header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="header-inner">
        <Link to="/" className="header-brand" aria-label="AgendaBoys home">
          <span className="header-brand-block">
            <span className="header-brand-title">AgendaBoys</span>
            <span className="header-brand-slug">
              See every side of every storyadfasdfsadf
            </span>
          </span>
        </Link>

        <nav className="header-nav" aria-label="Primary">
          <NavLink to="/" className={({ isActive }) => linkClass(isActive)} end>
            Home
          </NavLink>

          {/* ✅ active only when /news with NO topic (and also /news/:id etc without topic) */}
          <NavLink
            to="/news"
            className={() => linkClass(onNewsRoute && !currentTopic)}
          >
            News
          </NavLink>

          {/* ✅ active only when topic matches */}
          <NavLink
            to="/news?topic=national"
            className={() =>
              linkClass(onNewsRoute && currentTopic === "national")
            }
          >
            National
          </NavLink>

          <NavLink
            to="/news?topic=politics"
            className={() =>
              linkClass(onNewsRoute && currentTopic === "politics")
            }
          >
            Politics
          </NavLink>

          <NavLink
            to="/news?topic=business"
            className={() =>
              linkClass(onNewsRoute && currentTopic === "business")
            }
          >
            Business
          </NavLink>

          <NavLink
            to="/news?topic=sports"
            className={() =>
              linkClass(onNewsRoute && currentTopic === "sports")
            }
          >
            Sports
          </NavLink>

          <SignedOut>
            <NavLink
              to="/login"
              className={({ isActive }) => linkClass(isActive)}
            >
              Login
            </NavLink>
          </SignedOut>
        </nav>

        <div className="header-auth">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

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
        ref={menuRef}
        className={`header-menu ${menuOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal={menuOpen ? "true" : "false"}
        aria-hidden={!menuOpen}
        aria-label="Mobile navigation"
      >
        <div className="header-menu-header">
          <Link
            to="/"
            className="header-menu-brand"
            onClick={() => setMenuOpen(false)}
            aria-label="AgendaBoys home"
          >
            <span className="header-menu-brand-title">AgendaBoys</span>
            <span className="header-menu-brand-slug">
              Every side. Every story. Every Detail...aaaaaa
            </span>
          </Link>

          <button
            type="button"
            className="header-menu-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <div className="header-menu-body">
          <div className="header-menu-section">
            <span className="header-menu-label">Browse</span>

            <NavLink
              to="/"
              className={({ isActive }) => drawerLinkClass(isActive)}
              end
              ref={firstLinkRef}
            >
              Home
            </NavLink>

            <NavLink
              to="/news"
              className={() => drawerLinkClass(onNewsRoute && !currentTopic)}
            >
              News
            </NavLink>

            <NavLink
              to="/news?topic=national"
              className={() =>
                drawerLinkClass(onNewsRoute && currentTopic === "national")
              }
            >
              National
            </NavLink>
          </div>

          <div className="header-menu-divider" />

          <div className="header-menu-section">
            <span className="header-menu-label">Topics</span>

            <NavLink
              to="/news?topic=politics"
              className={() =>
                drawerLinkClass(onNewsRoute && currentTopic === "politics")
              }
            >
              Politics
            </NavLink>

            <NavLink
              to="/news?topic=business"
              className={() =>
                drawerLinkClass(onNewsRoute && currentTopic === "business")
              }
            >
              Business
            </NavLink>

            <NavLink
              to="/news?topic=sports"
              className={() =>
                drawerLinkClass(onNewsRoute && currentTopic === "sports")
              }
            >
              Sports
            </NavLink>
          </div>

          <div className="header-menu-divider" />

          <div className="header-menu-section">
            <span className="header-menu-label">Account</span>

            <SignedOut>
              <NavLink
                to="/login"
                className={({ isActive }) => drawerLinkClass(isActive)}
                onClick={() => setMenuOpen(false)}
              >
                Login
              </NavLink>
            </SignedOut>

            <SignedIn>
              <div className="header-drawer-user">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>
        </div>

        <div className="header-menu-footer">
          <span className="header-menu-hint">Tip: Press Esc to close</span>
        </div>
      </aside>
    </header>
  );
};

export default Header;
