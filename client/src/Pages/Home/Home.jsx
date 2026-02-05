// Home.jsx
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { baseUrl, NEWS_LIST_FIELDS } from "../../constants/constants";
import Spinner from "../../components/Spinner/Spinner";
import NewsCarousel from "../../components/NewsCarousel/NewsCarousel";
import NewsCategorySection from "../../components/NewsCategorySection/NewsCategorySection";
import "./home.styles.scss";

const fetchNews = async () => {
  const params = new URLSearchParams();
  params.set("page", "1");
  params.set("limit", "24");
  params.set("fields", NEWS_LIST_FIELDS);

  const res = await fetch(`${baseUrl}/api/news?${params.toString()}`);
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to fetch news");
  }

  const data = await res.json();
  return data.items || [];
};

const fetchTrending = async () => {
  const res = await fetch(`${baseUrl}/api/news/trending?limit=6`);
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to fetch trending");
  }

  const data = await res.json();
  return data.items || [];
};

const fetchMostDiscussed = async () => {
  const res = await fetch(`${baseUrl}/api/news/most-discussed?limit=6`);
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to fetch most discussed");
  }

  const data = await res.json();
  return data.items || [];
};

const SECTIONS = [
  { heading: "National", category: "national" },
  { heading: "Politics", category: "politics" },
  { heading: "Business", category: "business" },
  { heading: "Sports", category: "sports" },
];

const Home = () => {
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

  const { data: trending = [] } = useQuery({
    queryKey: ["news", "trending"],
    queryFn: fetchTrending,
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: mostDiscussed = [] } = useQuery({
    queryKey: ["news", "most-discussed"],
    queryFn: fetchMostDiscussed,
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

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

      <section className="home-highlight">
        <div className="home-highlight-header">
          <h2>Trending Now</h2>
          <span>Based on saves + comments</span>
        </div>

        <div className="home-highlight-grid">
          {trending.map((item) => (
            <Link
              key={item._id}
              to={`/news/${item._id}`}
              className="home-highlight-card"
            >
              <div className="home-highlight-meta">
                <span className="tag">{item.category || "news"}</span>
                <span className="tag subtle">{item.source || "source"}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{(item.summary || item.text || "").slice(0, 120)}...</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-highlight alt">
        <div className="home-highlight-header">
          <h2>Most Discussed</h2>
          <span>Hot takes from the community</span>
        </div>

        <div className="home-highlight-grid">
          {mostDiscussed.map((item) => (
            <Link
              key={item._id}
              to={`/news/${item._id}`}
              className="home-highlight-card"
            >
              <div className="home-highlight-meta">
                <span className="tag">{item.category || "news"}</span>
                <span className="tag subtle">{item.source || "source"}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{(item.summary || item.text || "").slice(0, 120)}...</p>
            </Link>
          ))}
        </div>
      </section>

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
