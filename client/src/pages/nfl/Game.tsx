import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaFootballBall } from 'react-icons/fa';
import axios from 'axios';
import ScoreboardView from './Scoreboard';
import SummaryView from './Summary';

import type { Event, ScoreboardResponse } from '@/types/espn/scoreboard';
import type { Summary } from '@/types/espn/summary';

interface NFLGameProps {
  activeTab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays' | 'odds' | 'pick';
  onTabChange: (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays' | 'odds' | 'pick') => void;
  onPresetChange: (preset: 'scoreboard' | 'summary') => void;
  onGameStatusChange?: (status: 'pre' | 'in' | 'post') => void;
  onRegisterTabClick?: (callback: (tab: string) => void) => void;
}

const NFLGame: React.FC<NFLGameProps> = ({ activeTab, onTabChange, onPresetChange, onGameStatusChange, onRegisterTabClick }) => {
  const { gameId } = useParams<{ gameId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navPreset, setNavPreset] = useState<'scoreboard' | 'summary'>('scoreboard');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [playLog, setPlayLog] = useState<Array<{ 
    text: string; 
    quarter: number; 
    clock: string; 
    yardage?: number;
    timestamp: Date;
    possession?: string;
    athletesInvolved?: Array<{
      id: string;
      fullName: string;
      displayName: string;
      shortName: string;
      headshot: string;
      jersey: string;
      position: string;
      team: { id: string };
    }>;
  }>>([]);
  


  // Notify parent of game status changes
  useEffect(() => {
    if (event && onGameStatusChange) {
      const gameState = event.competitions[0]?.status?.type?.state;
      if (gameState) {
        console.log('Game status being sent to parent:', gameState);
        onGameStatusChange(gameState as 'pre' | 'in' | 'post');
      }
    }
  }, [event, onGameStatusChange]);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) return;

      try {
        if (!event) {
          setLoading(true);
        } else {
          setIsRefreshing(true);
        }
        setError(null);

        let game: Event | undefined;
        let gameStatus: string | undefined;
        let usedSummaryApi = false;

        // Check if gameId is "test" - use local JSON file
        if (gameId === 'test') {
          const response = await axios.get<ScoreboardResponse>('/scoreboard.json');
          game = response.data.events?.[0];
          gameStatus = game?.competitions[0].status.type.state;
        } else {
          // Try to find game in current week's scoreboard first
          const scoreboardResponse = await axios.get<ScoreboardResponse>(
            `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`
          );
          game = scoreboardResponse.data.events?.find(e => e.id === gameId);
          gameStatus = game?.competitions[0].status.type.state;
          
          // Fetch summary API if:
          // 1. Game not found in scoreboard (past/future games), OR
          // 2. Game is not live (pre/post game)
          if (!game || gameStatus !== 'in') {
            try {
              const summaryResponse = await axios.get<Summary>(
                `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`
              );
              console.log('Summary data fetched:', summaryResponse.data);
              console.log('Drives in summary:', summaryResponse.data.drives);
              setSummary(summaryResponse.data);
              usedSummaryApi = true;
              
              // If game wasn't found in scoreboard, extract it from summary
              if (!game && summaryResponse.data.header) {
                game = summaryResponse.data.header as unknown as Event;
              }
            } catch (summaryErr) {
              console.error('Error fetching summary data:', summaryErr);
              if (!game) {
                // If we have no game data at all, show error
                setError('Game not found');
                setLoading(false);
                setIsRefreshing(false);
                return;
              }
              // Otherwise continue without summary data
            }
          }
        }
        
        if (!game) {
          setError('Game data not available');
          setLoading(false);
          setIsRefreshing(false);
          return;
        }
        
        // Check if last play has changed and update timestamp
        if (game.competitions[0].situation?.lastPlay) {
          const currentPlayText = game.competitions[0].situation.lastPlay.text;
          const previousPlayText = event?.competitions[0].situation?.lastPlay?.text;
          
          if (currentPlayText !== previousPlayText) {
            const newPlay = {
              text: currentPlayText,
              quarter: game.competitions[0].status.period,
              clock: game.competitions[0].status.displayClock,
              timestamp: new Date(),
              yardage: game.competitions[0].situation.lastPlay.statYardage,
              possession: game.competitions[0].situation.possession,
              athletesInvolved: game.competitions[0].situation.lastPlay.athletesInvolved
            };
            setPlayLog(prev => [newPlay, ...prev]);
          }
        }
        
        // Set nav preset based on which API provided the data
        const preset = usedSummaryApi ? 'summary' : 'scoreboard';
        setNavPreset(preset);
        onPresetChange(preset);
        setEvent(game);
        setLastUpdated(new Date());
        setCountdown(30); // Reset countdown
        setLoading(false);
        setIsRefreshing(false);
      } catch (err) {
        console.error('Error fetching game data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load game data');
        setLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchGameData();
  }, [gameId]);

  // Countdown timer effect for auto-refresh (only for live games)
  useEffect(() => {
    if (!event) return; // Don't start countdown until initial load
    
    // Only auto-refresh if using scoreboard API (live games)
    if (navPreset === 'summary') return; // Don't refresh final games
    
    if (countdown <= 0) {
      // Trigger a new fetch by updating a dependency
      const fetchGameData = async () => {
        if (!gameId) return;

        try {
          setIsRefreshing(true);
          setError(null);

          let game: Event | undefined;
          let gameStatus: string | undefined;
          let usedSummaryApi = false;

          if (gameId === 'test') {
            const response = await axios.get<ScoreboardResponse>('/scoreboard.json');
            game = response.data.events?.[0];
            gameStatus = game?.competitions[0].status.type.state;
          } else {
            const scoreboardResponse = await axios.get<ScoreboardResponse>(
              `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`
            );
            game = scoreboardResponse.data.events?.find(e => e.id === gameId);
            gameStatus = game?.competitions[0].status.type.state;
          }
          
          if (!game || gameStatus !== 'in') {
            try {
              const summaryResponse = await axios.get<Summary>(
                `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`
              );
              setSummary(summaryResponse.data);
              usedSummaryApi = true;
              
              if (!game && summaryResponse.data.header) {
                game = summaryResponse.data.header as unknown as Event;
              }
            } catch (summaryErr) {
              console.error('Error fetching summary data:', summaryErr);
            }
          }
          
          if (game) {
            // Check if last play has changed and update timestamp
            if (game.competitions[0].situation?.lastPlay) {
              const currentPlayText = game.competitions[0].situation.lastPlay.text;
              const previousPlayText = event?.competitions[0].situation?.lastPlay?.text;
              
              if (currentPlayText !== previousPlayText) {
                const newPlay = {
                  text: currentPlayText,
                  quarter: game.competitions[0].status.period,
                  clock: game.competitions[0].status.displayClock,
                  timestamp: new Date(),
                  yardage: game.competitions[0].situation.lastPlay.statYardage,
                  possession: game.competitions[0].situation.possession,
                  athletesInvolved: game.competitions[0].situation.lastPlay.athletesInvolved
                };
                setPlayLog(prev => [newPlay, ...prev]);
              }
            }
            
            const preset = usedSummaryApi ? 'summary' : 'scoreboard';
            setNavPreset(preset);
            onPresetChange(preset);
            setEvent(game);
            setLastUpdated(new Date());
          }
          
          setCountdown(30);
          setIsRefreshing(false);
        } catch (err) {
          console.error('Error refreshing game data:', err);
          setIsRefreshing(false);
          setCountdown(30);
        }
      };

      fetchGameData();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, gameId, event, navPreset]);

  const handleManualRefresh = () => {
    setCountdown(0); // Trigger immediate refresh
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1d2e] to-[#16182a] flex items-center justify-center">
        <div className="text-center">
          <FaFootballBall className="text-6xl text-[#00ffe7] mx-auto mb-4 animate-bounce" />
          <p className="text-[#e0e7ef] text-xl">Loading game details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1d2e] to-[#16182a] flex items-center justify-center pb-20">
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-8 text-center max-w-md">
          <p className="text-red-400 font-bold mb-2 text-lg">Error loading game</p>
          <p className="text-[#e0e7ef]">{error || 'Game not found'}</p>
        </div>
      </div>
    );
  }

  // Helper function to get logo URL - handles both scoreboard (logo string) and summary (logos array of TeamLogo)
  const getTeamLogo = (team: any): string => {
    if (team?.logo) return team.logo; // Scoreboard API: logo is a string
    if (team?.logos?.[0]?.href) return team.logos[0].href; // Summary API: logos is TeamLogo[]
    return '';
  };

  // Render the appropriate view based on navPreset
  if (navPreset === 'scoreboard') {
    return (
      <ScoreboardView
        event={event}
        activeTab={activeTab}
        onTabChange={onTabChange}
        getTeamLogo={getTeamLogo}
        playLog={playLog}
        lastUpdated={lastUpdated}
        countdown={countdown}
        isRefreshing={isRefreshing}
        onManualRefresh={() => setCountdown(0)}
      />
    );
  }

  return (
    <SummaryView
      event={event}
      summary={summary}
      activeTab={activeTab}
      onTabChange={onTabChange}
      getTeamLogo={getTeamLogo}
      playLog={playLog}
      gameId={gameId || ''}
    />
  );
};

export default NFLGame;
