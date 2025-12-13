import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaFootballBall } from 'react-icons/fa';
import axios from 'axios';
import ScoreboardView from './scoreboard/Scoreboard';
import SummaryView from './summary/Summary';
import { useLoading } from '@/providers/LoadingContext';

import type { Event, ScoreboardResponse } from '@/types/espn/scoreboard';
import type { Summary } from '@/types/espn/summary';

// Firebase Firestore endpoint (assuming you have a backend endpoint)
const FIRESTORE_API = '/api/playbyplay';

interface NFLGameProps {
  activeTab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays' | 'odds' | 'pick' | 'yourpicks';
  onTabChange: (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays' | 'odds' | 'pick' | 'yourpicks') => void;
  onPresetChange: (preset: 'scoreboard' | 'summary') => void;
  onGameStatusChange?: (status: 'pre' | 'in' | 'post') => void;
  onRegisterTabClick?: (callback: (tab: string) => void) => void;
}

const NFLGame: React.FC<NFLGameProps> = ({ activeTab, onTabChange, onPresetChange, onGameStatusChange, onRegisterTabClick }) => {
  const { gameId } = useParams<{ gameId: string }>();
  const { showLoading, hideLoading } = useLoading();
  const [event, setEvent] = useState<Event | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
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
  const [playsLoaded, setPlaysLoaded] = useState(false);

  // Load previous plays from Firebase on mount
  useEffect(() => {
    const loadPreviousPlays = async () => {
      if (!gameId || playsLoaded) return;

      // Check localStorage first
      const cacheKey = `playlog_${gameId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const { plays, timestamp } = JSON.parse(cachedData);
          const cacheAge = Date.now() - timestamp;
          const CACHE_DURATION = 1 * 60 * 1000; // 1 minute
          
          // Use cached data if less than 1 minute old
          if (cacheAge < CACHE_DURATION && Array.isArray(plays)) {
            console.log(`✅ Using cached plays (${plays.length} plays, ${Math.round(cacheAge / 1000)}s old)`);
            const historicalPlays = plays.map((play: any) => ({
              ...play,
              timestamp: new Date(play.timestamp)
            }));
            setPlayLog(historicalPlays);
            setPlaysLoaded(true);
            return;
          } else {
            console.log('Cache expired, fetching fresh data...');
          }
        } catch (error) {
          console.error('Error parsing cached plays:', error);
          localStorage.removeItem(cacheKey);
        }
      }

      try {
        showLoading('Loading play history...');
        console.log(`Loading previous plays for game ${gameId} from backend API...`);
        
        // Fetch from your backend API that connects to Firebase
        const response = await axios.get(`${FIRESTORE_API}/${gameId}`);
        
        if (response.data && response.data.plays && Array.isArray(response.data.plays)) {
          const historicalPlays = response.data.plays.map((play: any) => ({
            text: play.text || '',
            quarter: play.quarter || 0,
            clock: play.clock || '0:00',
            yardage: play.yardLine,
            timestamp: play.timestamp ? new Date(play.timestamp) : new Date(),
            possession: play.possession?.id || play.possession || play.team, // Extract ID if object, use string if available, fallback to team
            athletesInvolved: play.athletesInvolved || [],
            type: play.type || '',
            scoreValue: play.scoreValue || 0
          }));
          
          // Sort by timestamp descending (most recent first)
          historicalPlays.sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime());
          
          // Cache the data
          localStorage.setItem(cacheKey, JSON.stringify({
            plays: historicalPlays,
            timestamp: Date.now()
          }));
          
          setPlayLog(historicalPlays);
          setPlaysLoaded(true);
          console.log(`✅ Loaded ${historicalPlays.length} historical plays from backend`);
        } else {
          console.log('No plays found in backend for this game');
          setPlaysLoaded(true);
        }
      } catch (error: any) {
        console.error('Error loading previous plays from backend:', error);
        // Set playsLoaded to true even on error to prevent infinite retries
        setPlaysLoaded(true);
      } finally {
        hideLoading();
      }
    };

    loadPreviousPlays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]); // Only re-run when gameId changes

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

  // Shared fetch logic
  const fetchGameData = async (isInitialLoad: boolean = false) => {
    if (!gameId) return;

    try {
      if (isInitialLoad) {
        showLoading('Loading game details...');
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      let game: Event | undefined;
      let gameStatus: string | undefined;
      let usedSummaryApi = false;

      // Fetch from scoreboard or test file
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
        
        // Use summary API only for post-game or if game not found
        if (!game || gameStatus === 'post') {
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
            if (!game && isInitialLoad) {
              setError('Game not found');
              hideLoading();
              setIsRefreshing(false);
              return;
            }
          }
        }
      }
      
      if (!game) {
        setError('Game data not available');
        hideLoading();
        setIsRefreshing(false);
        return;
      }
      
      // Add new plays to log
      if (game.competitions[0].situation?.lastPlay) {
        const currentPlayText = game.competitions[0].situation.lastPlay.text;
        const previousPlayText = event?.competitions[0].situation?.lastPlay?.text;
        
        if (currentPlayText !== previousPlayText) {
          setPlayLog(prev => {
            const isDuplicate = prev.some(p => 
              p.text === currentPlayText && 
              p.quarter === game.competitions[0].status.period &&
              p.clock === game.competitions[0].status.displayClock
            );
            
            if (!isDuplicate) {
              const newPlay = {
                text: currentPlayText,
                quarter: game.competitions[0].status.period,
                clock: game.competitions[0].status.displayClock,
                timestamp: new Date(),
                yardage: game.competitions[0].situation?.lastPlay?.statYardage,
                possession: typeof game.competitions[0].situation?.possession,
                athletesInvolved: game.competitions[0].situation?.lastPlay?.athletesInvolved
              };
              return [newPlay, ...prev];
            }
            return prev;
          });
        }
      }
      
      const preset = usedSummaryApi ? 'summary' : 'scoreboard';
      setNavPreset(preset);
      onPresetChange(preset);
      setEvent(game);
      setLastUpdated(new Date());
      setCountdown(30);
      hideLoading();
      setIsRefreshing(false);
    } catch (err) {
      console.error('Error fetching game data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load game data');
      hideLoading();
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchGameData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  // Auto-refresh countdown
  useEffect(() => {
    if (!event || navPreset === 'summary') return;
    
    if (countdown <= 0) {
      fetchGameData(false);
      return;
    }

    const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, gameId, navPreset]);

  const handleManualRefresh = () => {
    setCountdown(0); // Trigger immediate refresh
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1d2e] to-[#16182a] flex items-center justify-center pb-20">
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-8 text-center max-w-md">
          <p className="text-red-400 font-bold mb-2 text-lg">Error loading game</p>
          <p className="text-[#e0e7ef]">{error}</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return null; // Loading state, don't show error
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
