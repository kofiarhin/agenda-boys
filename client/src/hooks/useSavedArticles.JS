import { useQuery } from "@tanstack/react-query";

const getSavedArticles = async () => {
  return [];
};

const useSavedArticles = () => {
  return useQuery({
    queryKey: ["saved-articles"],
    queryFn: getSavedArticles,
  });
};

export default useSavedArticles;
