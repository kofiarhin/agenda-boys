import { useQuery } from "@tanstack/react-query";
import { baseUrl } from "../constants/constants";

const getNews = async ({ page = 1, limit = 9, category = "all" } = {}) => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (category && category !== "all") params.set("category", category);

  const res = await fetch(`${baseUrl}/api/news?${params.toString()}`);
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Something went wrong");
  }
  return res.json(); // { items, meta }
};

const useNews = ({ page = 1, limit = 9, category = "all" } = {}) => {
  return useQuery({
    queryKey: ["news", { page, limit, category }],
    queryFn: () => getNews({ page, limit, category }),
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev, // keeps old page while loading new page
  });
};

export default useNews;
