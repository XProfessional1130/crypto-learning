'use client';

import React from 'react';
import { TeamDataProvider } from '@/lib/context/team-data-context';
import { DataCacheProvider } from '@/lib/context/data-cache-context';

export default function LCDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DataCacheProvider>
      <TeamDataProvider>
        {children}
      </TeamDataProvider>
    </DataCacheProvider>
  );
} 