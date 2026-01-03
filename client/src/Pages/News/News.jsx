import React from "react";
import useNews from "../../hooks/useNews";
import NewsList from "../../components/NewsList/NewsList";
import Spinner from "../../components/Spinner/Spinner";
const News = () => {
  const { data, isLoading } = useNews();

  if (isLoading) {
    return <Spinner />;
  }
  return <div className="container">{data && <NewsList items={data} />}</div>;
};

export default News;
