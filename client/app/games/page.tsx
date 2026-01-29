'use client';

import { AuthProvider, useAuth } from '../../src/providers/AuthContext';
import { LeagueProvider } from '../../src/providers/LeagueContext';
import { LoadingProvider } from '../../src/providers/LoadingContext';
import DashboardCarousel from '../../src/views/dashboard/Carousel';
import UnifiedGameGrid from '../../src/views/dashboard/GameGrid';
import LoginNavNext from '../../src/components/navs/LoginNavNext';
import BottomNavbarNext from '../../src/components/navs/BottomNavbarNext';
import { useRouter } from 'next/navigation';

function GamesContent() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <>
      <LoginNavNext />
      <div className="flex-1 relative mx-0 pt-14">
        {user ? (
          <DashboardCarousel 
            activeTab="games" 
            onTabChange={(tab) => {
              if (tab === 'dashboard') {
                router.push('/');
              }
            }} 
          />
        ) : (
          <UnifiedGameGrid />
        )}
      </div>
      {user && (
        <BottomNavbarNext 
          activeTab="games"
          onTabChange={(tab) => {
            if (tab === 'dashboard') {
              router.push('/');
            }
          }}
          preset="dashboard"
          isVisible={true}
        />
      )}
    </>
  );
}

export const dynamic = 'force-dynamic';

export default function Games() {
  return (
    <AuthProvider>
      <LoadingProvider>
        <LeagueProvider>
          <div className="min-h-screen overflow-x-hidden relative bg-black/90 bg-blend-overlay">
            <GamesContent />
          </div>
        </LeagueProvider>
      </LoadingProvider>
    </AuthProvider>
  );
}
