'use client';

import React from 'react';
import { TeamDataProvider } from '@/lib/context/team-data-context';

export default function LCDashboardLayout({
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