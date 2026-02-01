'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginNavNext from '../../../src/components/navs/LoginNavNext';
import BottomNavbarNext from '../../../src/components/navs/BottomNavbarNext';
import GameDetail from '../../../src/views/GameDetail';
import LoadingFootball from '../../../src/components/loading/LoadingFootball';
import { useState as useStateGame, useRef } from 'react';

export const dynamic = 'force-dynamic';

interface GamePageProps {
  params: Promise<{ gameId: string }>;
}

// Detect league from game data
async function detectLeague(gameId: string): Promise<'nfl' | 'nba' | null> {
  try {
    // Try NFL first
    let response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/events/${gameId}`,
      { signal: AbortSignal.timeout(3000) }
    );
    
    if (response.ok) {
      return 'nfl';
    }

    // Try NBA
    response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/events/${gameId}`,
      { signal: AbortSignal.timeout(3000) }
    );
    
    if (response.ok) {
      return 'nba';
    }

    return null;
  } catch (error) {
    return null;
  }
}

export default function GamePage({ params }: GamePageProps) {
  const [gameTab, setGameTab] = useStateGame<'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'schedule' | 'news' | 'plays' | 'odds' | 'pick' | 'yourpicks' | 'dashboard' | 'games' | 'chat'>('info');
  const [navPreset, setNavPreset] = useStateGame<'scoreboard' | 'summary' | 'team' | 'player' | 'dashboard'>('scoreboard');
  const [gameStatus, setGameStatus] = useStateGame<'pre' | 'in' | 'post'>();
  const [isLoading, setIsLoading] = useState(true);
  const [league, setLeague] = useState<'nfl' | 'nba' | null>(null);
  const tabClickCallbackRef = useRef<((tab: string) => void) | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initializeGame = async () => {
      try {
        const resolvedParams = await params;
        const detectedLeague = await detectLeague(resolvedParams.gameId);
        
        if (detectedLeague) {
          setLeague(detectedLeague);
          setIsLoading(false);
        } else {
          // If league not found, default to NFL and let GameDetail handle it
          setLeague('nfl');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error detecting league:', error);
        setLeague('nfl');
        setIsLoading(false);
      }
    };

    initializeGame();
  }, [params]);

  if (isLoading) {
    return <LoadingFootball message="Loading game..." />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden relative bg-black/90 bg-blend-overlay">
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
    </div>
  );
}
