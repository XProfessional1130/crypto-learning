import { useQuery } from '@tanstack/react-query';
import { DatabaseService, type Resource } from '@/lib/services/database';

export function useResources() {
  return useQuery<Resource[]>({
    queryKey: ['resources'],
    queryFn: () => DatabaseService.getResources(),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
} 