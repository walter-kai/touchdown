'use client';

import { useEffect, useRef, useState } from 'react';
import LoginNav from '../../../src/components/navs/LoginNav';
import BottomNavbar from '../../../src/components/navs/BottomNavbar';
import GameDetail from '../../../src/views/GameDetail';
import LoadingFootball from '../../../src/components/loading/LoadingFootball';
import { useLeague } from '../../../src/providers/LeagueContext';
import { useParams } from 'next/navigation';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [gameTab, setGameTab] = useState<'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'schedule' | 'news' | 'plays' | 'odds' | 'pick' | 'yourpicks' | 'dashboard' | 'games' | 'chat'>('info');
  const [navPreset, setNavPreset] = useState<'scoreboard' | 'summary' | 'team' | 'player' | 'dashboard'>('scoreboard');
  const [gameStatus, setGameStatus] = useState<'pre' | 'in' | 'post'>();
  const [isLoading, setIsLoading] = useState(true);
  const tabClickCallbackRef = useRef<((tab: string) => void) | null>(null);
  const { setLeague } = useLeague();

  useEffect(() => {
    if (!gameId || gameId === '[gameId]') {
      setIsLoading(false);
      return;
    }

    const detectLeague = async () => {
      try {
        // Try NFL scoreboard first
        const nflRes = await axios.get(
          `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?limit=100`,
          { timeout: 5000 }
        );
        const nflEvents = nflRes.data.events || [];
        if (nflEvents.some((e: any) => e.id === gameId)) {
          setLeague('nfl');
          setIsLoading(false);
          return;
        }

        // Try NBA scoreboard
        const nbaRes = await axios.get(
          `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?limit=100`,
          { timeout: 5000 }
        );
        const nbaEvents = nbaRes.data.events || [];
        if (nbaEvents.some((e: any) => e.id === gameId)) {
          setLeague('nba');
          setIsLoading(false);
          return;
        }

        // Game not found in current scoreboards, try archived/historical
        // Default to NFL and let GameDetail handle the 404
        setLeague('nfl');
        setIsLoading(false);
      } catch (error) {
        console.error('Error detecting league:', error);
        setLeague('nfl');
        setIsLoading(false);
      }
    };

    detectLeague();
  }, [gameId, setLeague]);

  if (isLoading) {
    return <LoadingFootball message="Loading game..." />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden relative bg-black/90 bg-blend-overlay">
      <LoginNav />
      <div className="flex-1 relative mx-0 pt-14">
        <GameDetail 
          activeTab={gameTab}
          onTabChange={setGameTab}
          onPresetChange={setNavPreset}
          onGameStatusChange={setGameStatus}
          onRegisterTabClick={(callback) => tabClickCallbackRef.current = callback}
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
