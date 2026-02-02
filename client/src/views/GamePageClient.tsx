'use client';

import { useState, useRef } from 'react';
import LoginNav from '../components/navs/LoginNav';
import BottomNavbar from '../components/navs/BottomNavbar';
import GameDetail from './GameDetail';

export default function GamePageClient({
  league,
  gameId,
}: {
  league: 'nfl' | 'nba';
  gameId: string;
}) {
  const [gameTab, setGameTab] = useState<
    'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'schedule' | 'news' | 'plays' | 'odds' | 'pick' | 'yourpicks' | 'dashboard' | 'games' | 'chat'
  >('info');
  const [navPreset, setNavPreset] = useState<'scoreboard' | 'summary' | 'team' | 'player' | 'dashboard'>('scoreboard');
  const [gameStatus, setGameStatus] = useState<'pre' | 'in' | 'post'>();
  const tabClickCallbackRef = useRef<((tab: string) => void) | null>(null);

  return (
    <div className="min-h-screen overflow-x-hidden relative bg-black/90 bg-blend-overlay">
      <LoginNav />
      <div className="flex-1 relative mx-0 pt-14">
        <GameDetail
          activeTab={gameTab}
          onTabChange={setGameTab}
          onPresetChange={setNavPreset}
          onGameStatusChange={setGameStatus}
          onRegisterTabClick={(callback) => (tabClickCallbackRef.current = callback)}
        />
      </div>
      <BottomNavbar
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
    </div>
  );
}
