import { useEffect } from "react";
import { baseUrl } from "../../constants/constants";
import { useQuery } from "@tanstack/react-query";
import NewsList from "../../components/NewsList/NewsList";
import Spinner from "../../components/Spinner/Spinner";
import NewsCarousel from "../../components/NewsCarousel/NewsCarousel";
import LatestNews from "../../components/LatestNews/LatestNews";
import MoreSection from "../../components/MoreSection/MoreSection";

const Home = () => {
  const getNews = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/news`);
      if (!res.ok) {
        throw new Error("somethign went wrong");
      }
      const data = await res.json();
      return data;
    } catch (error) {
      console.log(error.message);
    }
  };
  const { data, isLoading } = useQuery({
    queryKey: ["news"],
    queryFn: getNews,
  });

  console.log({ data });

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <>
      <div className="container">
        {data && (
          <>
            <NewsCarousel items={data} />
            <NewsList items={data} />
          </>
        )}
      </div>
    </>
  );
};

export default Home;
