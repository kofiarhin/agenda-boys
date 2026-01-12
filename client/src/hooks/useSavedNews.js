import { useQuery } from "@tanstack/react-query";

const fetchSavedNews = async (userId) => {
  const res = await fetch(`http://localhost:5000/api/news/saved/${userId}`);

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "unable to fetch data");
  }

  return res.json();
};

const useSavedNews = (userId) => {
  return useQuery({
    queryKey: ["news", userId],
    queryFn: () => fetchSavedNews(userId),
    enabled: !!userId,
    onSuccess: (data) => {
      console.log({ data });
    },
  });
};

export default useSavedNews;
