// client/src/components/Footer.jsx
import "./footer.styles.scss";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <a className="footer-logo" href="/" aria-label="Home">
              <span className="footer-logo-text">AgendaBoys</span>
            </a>
            <p className="footer-tagline">Ghana’s headlines, distilled.</p>
          </div>

          <nav className="footer-col" aria-label="News">
            <div className="footer-col-title">NEWS</div>
            <a className="footer-link" href="/latest">
              Latest
            </a>
            <a className="footer-link" href="/trending">
              Trending
            </a>
            <a className="footer-link" href="/topics">
              Topics
            </a>
            <a className="footer-link" href="/local">
              Local
            </a>
          </nav>

          <nav className="footer-col" aria-label="Discover">
            <div className="footer-col-title">DISCOVER</div>
            <a className="footer-link" href="/editors-picks">
              Editor&apos;s Picks
            </a>
            <a className="footer-link" href="/most-read">
              Most Read
            </a>
            <a className="footer-link" href="/sources">
              Sources
            </a>
            <a className="footer-link" href="/newsletter">
              Newsletter
            </a>
          </nav>

          <nav className="footer-col" aria-label="Company">
            <div className="footer-col-title">COMPANY</div>
            <a className="footer-link" href="/about">
              About
            </a>
            <a className="footer-link" href="/contact">
              Contact
            </a>
            <a className="footer-link" href="/advertise">
              Advertise
            </a>
            <a className="footer-link" href="/press">
              Press
            </a>
          </nav>

          <nav className="footer-col" aria-label="Legal">
            <div className="footer-col-title">LEGAL</div>
            <a className="footer-link" href="/terms">
              Terms of Use
            </a>
            <a className="footer-link" href="/privacy">
              Privacy Policy
            </a>
            <a className="footer-link" href="/cookies">
              Cookie Policy
            </a>
          </nav>
        </div>

        <div className="footer-bottom">
          <div className="footer-copy">
            © {year} AgendaBoys. All rights reserved.
          </div>

          <div className="footer-social">
            <a className="footer-social-link" href="/newsletter">
              Newsletter
            </a>
            <a className="footer-social-link" href="/rss">
              RSS
            </a>
            <a className="footer-social-link" href="/app">
              Get the App
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
