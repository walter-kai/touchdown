'use client';

import { useAuth } from '../../src/providers/AuthContext';
import Carousel from '../../src/views/dashboard/Carousel';
import GameGrid from '../../src/views/dashboard/GameGrid';
import LoginNavNext from '../../src/components/navs/LoginNavNext';
import BottomNavbarNext from '../../src/components/navs/BottomNavbarNext';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function Games() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen overflow-x-hidden relative bg-black/90 bg-blend-overlay">
      <LoginNavNext />
      <div className="flex-1 relative mx-0 pt-14">
        {user ? (
          <Carousel 
            activeTab="games" 
            onTabChange={(tab) => {
              if (tab === 'dashboard') {
                router.push('/');
              }
            }} 
          />
        ) : (
          <GameGrid />
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
    </div>
  );
}
