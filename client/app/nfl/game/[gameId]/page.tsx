'use client';

import { AuthProvider } from '../../../../src/providers/AuthContext';
import { LeagueProvider } from '../../../../src/providers/LeagueContext';
import { LoadingProvider } from '../../../../src/providers/LoadingContext';
import { PicksProvider } from '../../../../src/providers/PicksContext';
import LoginNavNext from '../../../../src/components/navs/LoginNavNext';
import BottomNavbarNext from '../../../../src/components/navs/BottomNavbarNext';
import GameDetail from '../../../../src/views/GameDetail';
import { useState, useRef } from 'react';

function NFLGameContent() {
  const [gameTab, setGameTab] = useState<'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'schedule' | 'news' | 'plays' | 'odds' | 'pick' | 'yourpicks' | 'dashboard' | 'games' | 'chat'>('info');
  const [navPreset, setNavPreset] = useState<'scoreboard' | 'summary' | 'team' | 'player' | 'dashboard'>('scoreboard');
  const [gameStatus, setGameStatus] = useState<'pre' | 'in' | 'post'>();
  const tabClickCallbackRef = useRef<((tab: string) => void) | null>(null);

  return (
    <>
      <LoginNavNext />
      <div className="flex-1 relative mx-0 pt-14">
        <GameDetail 
          activeTab={gameTab}
          onTabChange={setGameTab}
          onPresetChange={setNavPreset}
          onGameStatusChange={setGameStatus}
          onRegisterTabClick={(callback) => tabClickCallbackRef.current = callback}
        />
      </div>
      <BottomNavbarNext
        activeTab={gameTab}
        onTabChange={setGameTab}
        onTabClick={(tab) => {
          if (tabClickCallbackRef.current) {
            tabClickCallbackRef.current(tab);
          }
        }}
        preset={navPreset}
        gameStatus={gameStatus}
        isVisible={true}
      />
    </>
  );
}

export const dynamic = 'force-dynamic';

export default function NFLGamePage() {
  return (
    <AuthProvider>
      <LoadingProvider>
        <LeagueProvider>
          <PicksProvider>
            <div className="min-h-screen overflow-x-hidden relative bg-black/90 bg-blend-overlay">
              <NFLGameContent />
            </div>
          </PicksProvider>
        </LeagueProvider>
      </LoadingProvider>
    </AuthProvider>
  );
}
