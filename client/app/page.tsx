'use client';

import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../src/providers/AuthContext';
import { LeagueProvider } from '../src/providers/LeagueContext';
import { LoadingProvider } from '../src/providers/LoadingContext';
import App from '../src/App';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render Router until client-side hydration is complete
  if (!isMounted) {
    return null;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <LeagueProvider>
          <LoadingProvider>
            <App />
          </LoadingProvider>
        </LeagueProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
