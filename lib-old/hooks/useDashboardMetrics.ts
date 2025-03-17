import { useQuery } from '@tanstack/react-query';
import { DatabaseService, type DashboardMetric } from '@/lib/services/database';
import { useAuth } from '@/lib/context/auth-context';

export function useDashboardMetrics() {
  const { user } = useAuth();

  return useQuery<DashboardMetric[]>({
    queryKey: ['dashboard-metrics', user?.id],
    queryFn: () => DatabaseService.getDashboardMetrics(user?.id || ''),
    enabled: !!user?.id, // Only fetch if we have a user ID
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus for real-time updates
  });
} 