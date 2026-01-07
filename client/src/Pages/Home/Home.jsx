import { useQuery } from "@tanstack/react-query";
import { baseUrl } from "../../constants/constants";
import Spinner from "../../components/Spinner/Spinner";
import NewsCarousel from "../../components/NewsCarousel/NewsCarousel";
import NewsCategorySection from "../../components/NewsCategorySection/NewsCategorySection";

const fetchNews = async () => {
  const res = await fetch(`${baseUrl}/api/news`);
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to fetch news");
  }
  return res.json();
};

const SECTIONS = [
  { heading: "National", category: "national" },
  { heading: "Politics", category: "politics" },
  { heading: "Business", category: "business" },
];

const Home = () => {
  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
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
      {/* Top stories */}
      <NewsCarousel items={data} />

      {/* Category sections */}
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
