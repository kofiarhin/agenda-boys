import { useQuery } from "@tanstack/react-query";
import { baseUrl } from "../constants/constants";

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

const useNews = () => {
  return useQuery({
    queryKey: ["news"],
    queryFn: getNews,
  });
};

export default useNews;
