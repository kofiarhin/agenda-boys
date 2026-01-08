// Home.jsx
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { baseUrl } from "../../constants/constants";
import Spinner from "../../components/Spinner/Spinner";
import NewsCarousel from "../../components/NewsCarousel/NewsCarousel";
import NewsCategorySection from "../../components/NewsCategorySection/NewsCategorySection";
import "./home.styles.scss";

const INTRO_TEXT = "Curating today\u2019s headlines\u2026";
const INTRO_MS = 3000;

const randChar = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&*+-/<>?";
  return chars[Math.floor(Math.random() * chars.length)];
};

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const scrambleFrame = (target, p) => {
  const len = target.length;
  const s = target.split("").map((ch, i) => {
    if (ch === " ") return " ";
    const stagger = (i / Math.max(1, len - 1)) * 0.38; // cascade
    const local = clamp((p - stagger) / (1 - 0.38), 0, 1);

    if (local > 0.92) return ch;

    // "clean" scramble: sometimes keep punctuation
    if (/[’'….,:;!?]/.test(ch)) return local > 0.35 ? ch : randChar();

    return randChar();
  });

  return s.join("");
};

const fetchNews = async () => {
  const params = new URLSearchParams();
  params.set("page", "1");
  params.set("limit", "60");

  const res = await fetch(`${baseUrl}/api/news?${params.toString()}`);
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to fetch news");
  }

  const data = await res.json();
  return data.items || [];
};

const SECTIONS = [
  { heading: "National", category: "national" },
  { heading: "Politics", category: "politics" },
  { heading: "Business", category: "business" },
];

const IntroSplash = ({ isLeaving }) => {
  const [display, setDisplay] = useState(INTRO_TEXT);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setDisplay(INTRO_TEXT);
      return;
    }

    const start = performance.now();
    const duration = 1200;
    let raf = 0;

    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      setDisplay(scrambleFrame(INTRO_TEXT, p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const chars = useMemo(() => display.split(""), [display]);

  return (
    <div className={`intro-splash ${isLeaving ? "is-leaving" : ""}`}>
      <div className="intro-vignette" aria-hidden="true" />
      <div className="intro-scanlines" aria-hidden="true" />
      <div className="intro-noise" aria-hidden="true" />

      <div className="intro-ticker" aria-hidden="true">
        <div className="intro-ticker-track">
          <span>BREAKING</span>
          <span>•</span>
          <span>POLITICS</span>
          <span>•</span>
          <span>BUSINESS</span>
          <span>•</span>
          <span>NATIONAL</span>
          <span>•</span>
          <span>LIVE UPDATES</span>
          <span>•</span>
          <span>TOP STORIES</span>
          <span>•</span>
        </div>
        <div className="intro-ticker-track intro-ticker-track-2">
          <span>BREAKING</span>
          <span>•</span>
          <span>POLITICS</span>
          <span>•</span>
          <span>BUSINESS</span>
          <span>•</span>
          <span>NATIONAL</span>
          <span>•</span>
          <span>LIVE UPDATES</span>
          <span>•</span>
          <span>TOP STORIES</span>
          <span>•</span>
        </div>
      </div>

      <div className="intro-card">
        <div className="intro-shine" aria-hidden="true" />

        <div className="intro-kicker">
          <span className="intro-dot" aria-hidden="true" />
          NEWS AGGREGATOR
        </div>

        <h1
          className="intro-title"
          data-final={INTRO_TEXT}
          aria-label={INTRO_TEXT}
        >
          <span className="intro-title-inner" aria-hidden="true">
            {chars.map((ch, i) => (
              <span key={i} className="intro-char" style={{ "--i": i }}>
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
          </span>
        </h1>

        <div className="intro-sub">
          syncing sources{" "}
          <span className="intro-ellipsis" aria-hidden="true">
            ...
          </span>
        </div>

        <div className="intro-progress" aria-hidden="true">
          <span className="intro-progress-bar" />
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const [introDone, setIntroDone] = useState(false);
  const [introLeaving, setIntroLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = setTimeout(() => setIntroLeaving(true), INTRO_MS - 350);
    const doneTimer = setTimeout(() => setIntroDone(true), INTRO_MS);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["news", "home"],
    queryFn: fetchNews,
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  if (!introDone) return <IntroSplash isLeaving={introLeaving} />;

  if (isLoading) return <Spinner />;

  if (isError) {
    return (
      <div className="container">
        <p className="error-text">
          {error?.message || "Something went wrong."}
        </p>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="container">
        <p>No news yet.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <NewsCarousel items={data} />

      {SECTIONS.map(({ heading, category }) => {
        const items = data.filter(
          (n) => (n?.category || "").toLowerCase() === category
        );

        if (!items.length) return null;

        return (
          <div key={category}>
            <NewsCategorySection
              heading={heading}
              data={items}
              category={category}
            />
          </div>
        );
      })}
    </div>
  );
};

export default Home;
