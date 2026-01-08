// Home/intro-splash/IntroSplash.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./intro-splash.styles.scss";

const INTRO_TEXT = "Curating today\u2019s headlines\u2026";

const STAGES = [
  "Boot sequence",
  "Secure handshakes",
  "Live wires",
  "Deduplicate",
  "Fact routing",
  "Signal scan",
  "Relevance rank",
  "Front page build",
  "Polish + cache",
  "Ready",
];

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const formatClock = (d) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toLocaleTimeString();
  }
};

const hex = (n) =>
  Math.floor(Math.random() * Math.pow(16, n))
    .toString(16)
    .toUpperCase()
    .padStart(n, "0");

const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

const IntroSplash = ({ isLeaving, durationMs = 5200, exitMs = 520 }) => {
  const rootRef = useRef(null);

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [percent, setPercent] = useState(0);
  const [clock, setClock] = useState(() => formatClock(new Date()));
  const [ping, setPing] = useState(() => 10 + Math.floor(Math.random() * 38));
  const [build, setBuild] = useState(
    () => 9000 + Math.floor(Math.random() * 900)
  );
  const [typed, setTyped] = useState("");

  const session = useMemo(() => hex(4), []);
  const node = useMemo(() => hex(3), []);

  useEffect(() => {
    document.body.classList.add("intro-splash-lock");
    return () => document.body.classList.remove("intro-splash-lock");
  }, []);

  useEffect(() => {
    const id = setInterval(() => setClock(formatClock(new Date())), 10_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setPercent(100);
      setTyped(INTRO_TEXT);
      return;
    }

    const start = performance.now();
    let raf = 0;
    let last = -1;

    const tick = (t) => {
      const raw = clamp((t - start) / durationMs, 0, 1);
      const eased = easeOutExpo(raw);
      const p = Math.round(eased * 100);

      if (p !== last) {
        last = p;
        setPercent(p);
        if (p % 9 === 0) setPing(10 + Math.floor(Math.random() * 55));
        if (p % 13 === 0) setBuild((v) => v + 1);
      }

      if (raw < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;

    const start = performance.now();
    const total = INTRO_TEXT.length;
    let raf = 0;

    const tick = (t) => {
      const raw = clamp((t - start) / 1200, 0, 1);
      const count = clamp(Math.floor(raw * total), 0, total);
      setTyped(INTRO_TEXT.slice(0, count));
      if (raw < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;

    const el = rootRef.current;
    if (!el) return;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;

      el.style.setProperty("--mx", `${Math.round(x * 100)}%`);
      el.style.setProperty("--my", `${Math.round(y * 100)}%`);
      el.style.setProperty("--px", `${Math.round((x - 0.5) * 18)}px`);
      el.style.setProperty("--py", `${Math.round((y - 0.5) * 14)}px`);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduceMotion]);

  const stageIdx = useMemo(() => {
    const step = 100 / (STAGES.length - 1);
    return clamp(Math.floor(percent / step), 0, STAGES.length - 1);
  }, [percent]);

  const stats = useMemo(() => {
    const sources = clamp(18 + Math.floor(percent * 0.62), 18, 92);
    const stories = clamp(120 + Math.floor(percent * 9.8), 120, 1100);
    const wires = clamp(6 + Math.floor(percent * 0.22), 6, 28);
    const ranked = clamp(Math.floor(percent * 7.6), 0, 760);
    return { sources, stories, wires, ranked };
  }, [percent]);

  return (
    <div
      ref={rootRef}
      className={`intro-splash ${isLeaving ? "is-leaving" : ""}`}
      style={{
        "--intro-ms": `${durationMs}ms`,
        "--intro-exit-ms": `${exitMs}ms`,
        "--p": `${percent}%`,
      }}
    >
      <div className="intro-bg" aria-hidden="true" />
      <div className="intro-mesh" aria-hidden="true" />
      <div className="intro-lines" aria-hidden="true" />
      <div className="intro-dots" aria-hidden="true" />
      <div className="intro-sweep" aria-hidden="true" />
      <div className="intro-vignette" aria-hidden="true" />

      <div className="intro-shell">
        <div className="intro-topbar">
          <div className="intro-brand">
            <span className="intro-mark" aria-hidden="true" />
            <span className="intro-brand-name">Newsroom</span>
            <span className="intro-pill">LIVE</span>
            <span className="intro-pill intro-pill-soft">PING {ping}ms</span>
          </div>

          <div className="intro-meta">
            <span className="intro-pill intro-pill-soft">{clock}</span>
            <span className="intro-pill intro-pill-soft">NODE {node}</span>
            <span className="intro-pill intro-pill-soft">S/{session}</span>
          </div>
        </div>

        <div className="intro-main">
          <div className="intro-rail">
            <div className="intro-rail-title">Pipeline</div>

            <div className="intro-rail-list" aria-hidden="true">
              {STAGES.map((s, i) => (
                <div
                  key={s}
                  className={`intro-rail-item ${
                    i === stageIdx ? "is-active" : ""
                  } ${i < stageIdx ? "is-done" : ""}`}
                >
                  <span className="intro-rail-dot" />
                  <span className="intro-rail-label">{s}</span>
                </div>
              ))}
            </div>

            <div className="intro-rail-foot">
              <div className="intro-rail-kv">
                <span className="intro-rail-k">Wires</span>
                <span className="intro-rail-v">{stats.wires}</span>
              </div>
              <div className="intro-rail-kv">
                <span className="intro-rail-k">Build</span>
                <span className="intro-rail-v">{build}</span>
              </div>
            </div>
          </div>

          <div className="intro-center">
            <div className="intro-badge">
              <span className="intro-badge-dot" aria-hidden="true" />
              Assembling front page
            </div>

            <h1 className="intro-title" aria-label={INTRO_TEXT}>
              <span className="intro-title-text">{typed}</span>
              <span className="intro-caret" aria-hidden="true" />
            </h1>

            <div className="intro-sub">
              <span className="intro-sub-strong">{STAGES[stageIdx]}</span>
              <span className="intro-sub-sep">•</span>
              <span className="intro-sub-mono">{stats.sources} sources</span>
              <span className="intro-sub-sep">•</span>
              <span className="intro-sub-mono">{stats.stories} stories</span>
              <span className="intro-sub-sep">•</span>
              <span className="intro-sub-mono">{stats.ranked} ranked</span>
            </div>

            <div className="intro-meter">
              <div className="intro-meter-track" aria-hidden="true">
                <span className="intro-meter-fill" />
                <span className="intro-meter-glint" />
                <span className="intro-meter-ticks" />
              </div>
              <div className="intro-meter-meta">
                <span className="intro-meter-left">
                  secure ingest • low-latency cache
                </span>
                <span className="intro-meter-right">{percent}%</span>
              </div>
            </div>
          </div>

          <div className="intro-stats">
            <div className="intro-card">
              <div className="intro-card-k">ingest</div>
              <div className="intro-card-v">{clamp(percent + 12, 0, 100)}%</div>
              <div className="intro-card-bar" aria-hidden="true">
                <span
                  className="intro-card-bar-fill"
                  style={{ "--w": `${clamp(percent + 12, 0, 100)}%` }}
                />
              </div>
            </div>

            <div className="intro-card">
              <div className="intro-card-k">verify</div>
              <div className="intro-card-v">{clamp(percent - 6, 0, 100)}%</div>
              <div className="intro-card-bar" aria-hidden="true">
                <span
                  className="intro-card-bar-fill"
                  style={{ "--w": `${clamp(percent - 6, 0, 100)}%` }}
                />
              </div>
            </div>

            <div className="intro-card">
              <div className="intro-card-k">rank</div>
              <div className="intro-card-v">{clamp(percent - 2, 0, 100)}%</div>
              <div className="intro-card-bar" aria-hidden="true">
                <span
                  className="intro-card-bar-fill"
                  style={{ "--w": `${clamp(percent - 2, 0, 100)}%` }}
                />
              </div>
            </div>

            <div className="intro-mini">
              <div className="intro-mini-row">
                <span className="intro-mini-k">latency</span>
                <span className="intro-mini-v">{ping}ms</span>
              </div>
              <div className="intro-mini-row">
                <span className="intro-mini-k">cache</span>
                <span className="intro-mini-v">warm</span>
              </div>
              <div className="intro-mini-row">
                <span className="intro-mini-k">mode</span>
                <span className="intro-mini-v">focus</span>
              </div>
            </div>
          </div>
        </div>

        <div className="intro-footer">
          <div className="intro-footer-left">
            built for speed • clean signal • zero noise
          </div>
          <div className="intro-footer-right">
            NWS/{node} • BUILD {build}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroSplash;
