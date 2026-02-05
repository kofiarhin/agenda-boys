import { useQuery } from '@tanstack/react-query';
import { baseUrl } from '../constants/constants';

const fetchSuggestions = async (q) => {
  const params = new URLSearchParams();
  params.set('q', q);

  const res = await fetch(`${baseUrl}/api/news/suggestions?${params.toString()}`);

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'Failed to fetch suggestions');
  }

  return res.json();
};

const useNewsSuggestions = (q) =>
  useQuery({
    queryKey: ['news', 'suggestions', q],
    queryFn: () => fetchSuggestions(q),
    enabled: Boolean(q && q.length >= 2),
    staleTime: 60_000,
    retry: 1,
  });

export default useNewsSuggestions;
