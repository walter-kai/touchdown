'use client';

import { useAuth } from '../src/providers/AuthContext';
import { useLoading } from '../src/providers/LoadingContext';
import Carousel from '../src/views/dashboard/Carousel';
import GameGrid from '../src/views/dashboard/GameGrid';
import LoginNavNext from '../src/components/navs/LoginNavNext';
import BottomNavbarNext from '../src/components/navs/BottomNavbarNext';
import LoadingFootball from '../src/components/loading/LoadingFootball';
import { useState } from 'react';

export const dynamic = 'force-dynamic';

export default function Home() {
  const { user } = useAuth();
  const { isLoading, loadingMessage } = useLoading();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'games'>('dashboard');

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
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />
        ) : (
          <GameGrid />
        )}
      </div>

    </div>
  );
}
