'use client';

import React from 'react';
import { TeamDataProvider } from '@/lib/context/team-data-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TeamDataProvider>
      {children}
    </TeamDataProvider>
  );
} 