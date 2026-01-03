// hooks/useNewsDetails.js
import { baseUrl } from "../constants/constants";
import { useQuery } from "@tanstack/react-query";

const getNewsDetails = async (id) => {
  const res = await fetch(`${baseUrl}/api/news/${id}`);

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  const data = await res.json();
  return data; // ✅ FIX
};

const useNewsDetails = (id) => {
  return useQuery({
    queryKey: ["news-details", id],
    queryFn: () => getNewsDetails(id),
    enabled: !!id,
  });
};

export default useNewsDetails;
