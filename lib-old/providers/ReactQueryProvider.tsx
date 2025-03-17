'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * Provides React Query context to the application
 * This enables efficient data fetching, caching, and synchronization
 */
export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  // Create a client for each session
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Optimize default query settings
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
} 