import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { fetchEnabledWebapps } from '@/services/pluginService';

export function useEnabledWebapps() {
  const query = useQuery({
    queryKey: [QUERY_KEYS.WEBAPPS],
    queryFn: fetchEnabledWebapps,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    webapps: query.data ?? [],
    isLoading: query.isLoading,
  };
}
