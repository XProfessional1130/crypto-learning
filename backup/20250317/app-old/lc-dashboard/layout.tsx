'use client';

import React from 'react';
import { TeamDataProvider } from '@/lib/providers/team-data-provider';

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