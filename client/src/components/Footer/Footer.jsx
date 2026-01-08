// client/src/components/Footer.jsx
import { useEffect, useState } from "react";
import "./footer.styles.scss";

const Footer = () => {
  const [time, setTime] = useState("");
  const year = new Date().getFullYear();

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Accra",
    });

    const tick = () => setTime(fmt.format(new Date()));
    tick();

    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <a className="footer-brand" href="/" aria-label="AgendaBoys home">
            <div className="footer-brand-text">
              <div className="footer-name">AgendaBoys</div>
              <div className="footer-sub">5-Minute Ghana Digest</div>
            </div>
          </a>

          <div className="footer-meta">
            <div className="footer-chip">
              <span className="footer-chip-label">Accra time</span>
              <span className="footer-chip-value">{time || "--:--"}</span>
            </div>

            <div className="footer-chip">
              <span className="footer-chip-label">Signal</span>
              <span className="footer-chip-value footer-live">
                Live <span className="footer-dot" aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>

        <div className="footer-mid">
          <p className="footer-pitch">
            Ghana’s headlines, distilled. Built for speed, clarity, and
            late-night scrolling.
          </p>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            © {year} AgendaBoys. All rights reserved.
          </p>

          <div className="footer-fine">
            <span className="footer-fine-item">Built in Ghana</span>
            <span className="footer-sep" aria-hidden="true">
              •
            </span>
            <span className="footer-fine-item">Fast digest mode</span>
            <span className="footer-sep" aria-hidden="true">
              •
            </span>
            <span className="footer-fine-item">No noise</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
