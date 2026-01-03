// client/src/components/Footer.jsx
import { useEffect, useState } from "react";
import "./footer.styles.scss";

const Footer = () => {
  const [time, setTime] = useState("");
  const year = new Date().getFullYear();

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    tick();
    const t = setInterval(tick, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <footer className="site-footer">
      <div className="site-footer__fx" aria-hidden="true" />

      <div className="site-footer__container">
        <div className="site-footer__top">
          <a className="site-footer__brand" href="/">
            <div className="site-footer__brand-text">
              <div className="site-footer__name">AgendaBoys</div>
              <div className="site-footer__sub">5-Minute Ghana Digest</div>
            </div>
          </a>

          <div className="site-footer__meta">
            <div className="site-footer__chip">
              <span className="site-footer__chip-label">Accra time</span>
              <span className="site-footer__chip-value">{time || "--:--"}</span>
            </div>

            <div className="site-footer__chip">
              <span className="site-footer__chip-label">Signal</span>
              <span className="site-footer__chip-value is-live">
                Live <span className="site-footer__dot" aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>

        <div className="site-footer__mid">
          <div className="site-footer__pitch">
            Ghana’s headlines, distilled. Built for speed, clarity, and
            late-night scrolling.
          </div>
        </div>

        <div className="site-footer__bottom">
          <p className="site-footer__copyright">
            © {year} AgendaBoys. All rights reserved.
          </p>

          <div className="site-footer__fine">
            <span className="site-footer__fine-item">Built in Ghana</span>
            <span className="site-footer__sep" aria-hidden="true">
              •
            </span>
            <span className="site-footer__fine-item">Fast digest mode</span>
            <span className="site-footer__sep" aria-hidden="true">
              •
            </span>
            <span className="site-footer__fine-item">No noise</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
