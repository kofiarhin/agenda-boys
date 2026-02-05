import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { baseUrl, NEWS_LIST_FIELDS } from "../constants/constants";

const getNews = async ({
  page = 1,
  limit = 9,
  category = "all",
  q = "",
  fields = NEWS_LIST_FIELDS,
  signal,
} = {}) => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (category && category !== "all") params.set("category", category);
  if (q) params.set("q", q);
  if (fields) params.set("fields", fields);

  const res = await fetch(`${baseUrl}/api/news?${params.toString()}`, {
    signal,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Something went wrong");
  }

  return res.json(); // { items, meta }
};

const useNews = ({
  page = 1,
  limit = 9,
  category = "all",
  q = "",
  fields = NEWS_LIST_FIELDS,
} = {}) => {
  return useQuery({
    queryKey: ["news", page, limit, category, q, fields],
    queryFn: ({ signal }) =>
      getNews({ page, limit, category, q, fields, signal }),
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
};

export default useNews;
