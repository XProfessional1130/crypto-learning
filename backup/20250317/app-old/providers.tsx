'use client';

import React, { ReactNode } from 'react';
import { TeamDataProvider } from '@/lib/providers/team-data-provider';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <TeamDataProvider>
      {children}
    </TeamDataProvider>
  );
} 