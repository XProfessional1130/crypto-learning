import { useQuery } from '@tanstack/react-query';
import { DatabaseService, type DashboardMetric } from '@/lib/api/database';
import { useAuth } from '@/lib/providers/auth-provider';

export function useDashboardMetrics() {
  const { user } = useAuth();

  return useQuery<DashboardMetric[]>({
    queryKey: ['dashboard-metrics', user?.id],
    queryFn: () => DatabaseService.getDashboardMetrics(user?.id || ''),
    enabled: !!user?.id, // Only fetch if we have a user ID
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
} 