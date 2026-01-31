'use client';

import { useAuth } from '../src/providers/AuthContext';
import { useLoading } from '../src/providers/LoadingContext';
import Carousel from '../src/views/dashboard/Carousel';
import GameGrid from '../src/views/dashboard/GameGrid';
import LoginNavNext from '../src/components/navs/LoginNavNext';
import BottomNavbarNext from '../src/components/navs/BottomNavbarNext';
import LoadingFootball from '../src/components/loading/LoadingFootball';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const { isLoading, loadingMessage } = useLoading();

  return (
    <div className="min-h-screen overflow-x-hidden relative bg-black bg-blend-overlay">
      <LoginNavNext />
      {isLoading && (
        <div className="fixed inset-0 z-40">
          <LoadingFootball message={loadingMessage} />
        </div>
      )}
      <div className="flex-1 relative mx-0 pt-14">
        {user ? (
          <Carousel 
            activeTab="dashboard" 
            onTabChange={(tab) => {
              if (tab === 'games') {
                router.push('/games');
              }
            }} 
          />
        ) : (
          <GameGrid />
        )}
      </div>
      {user && (
        <BottomNavbarNext 
          activeTab="dashboard"
          onTabChange={(tab) => {
            if (tab === 'games') {
              router.push('/games');
            }
          }}
          preset="dashboard"
          isVisible={true}
        />
      )}
    </div>
  );
}
