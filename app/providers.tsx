'use client';

import React, { ReactNode } from 'react';
import { TeamDataProvider } from '@/lib/context/team-data-context';

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