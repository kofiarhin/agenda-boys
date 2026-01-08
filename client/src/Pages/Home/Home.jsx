// Home.jsx
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { baseUrl } from "../../constants/constants";
import Spinner from "../../components/Spinner/Spinner";
import NewsCarousel from "../../components/NewsCarousel/NewsCarousel";
import NewsCategorySection from "../../components/NewsCategorySection/NewsCategorySection";
import IntroSplash from "./IntroSplash/IntroSplash/IntroSplash/IntroSplash";
import "./home.styles.scss";

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

const INTRO_MS = 5200;
const INTRO_EXIT_MS = 520;

const Home = () => {
  const [introDone, setIntroDone] = useState(false);
  const [introLeaving, setIntroLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = setTimeout(
      () => setIntroLeaving(true),
      INTRO_MS - INTRO_EXIT_MS
    );
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

  if (!introDone)
    return (
      <IntroSplash
        isLeaving={introLeaving}
        durationMs={INTRO_MS}
        exitMs={INTRO_EXIT_MS}
      />
    );

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
