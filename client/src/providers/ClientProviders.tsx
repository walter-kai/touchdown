'use client';

import { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { LeagueProvider } from './LeagueContext';
import { LoadingProvider } from './LoadingContext';
import { PicksProvider } from './PicksContext';

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <LoadingProvider>
        <LeagueProvider>
          <PicksProvider>
            {children}
          </PicksProvider>
        </LeagueProvider>
      </LoadingProvider>
    </AuthProvider>
  );
}
