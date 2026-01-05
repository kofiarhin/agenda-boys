import React from "react";
import { useSearchParams } from "react-router-dom";
import useNews from "../../hooks/useNews";
import NewsList from "../../components/NewsList/NewsList";
import Spinner from "../../components/Spinner/Spinner";

const News = () => {
  const [params] = useSearchParams();
  const topic = (params.get("topic") || "all").toLowerCase();

  const { data, isLoading } = useNews(topic);

  if (isLoading) return <Spinner />;

  const items = Array.isArray(data) ? data : data?.items || [];

  return (
    <div className="container">
      <NewsList topic={topic} items={items} />
    </div>
  );
};

export default News;
