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
  activeTab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays' | 'odds' | 'pick' | 'top' | 'yourpicks' | 'schedule' | 'news';
  onTabChange: (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays' | 'odds' | 'pick' | 'top' | 'yourpicks' | 'schedule' | 'news') => void;
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
        // In test mode, skip backend play-by-play API call
        if (gameId === 'test') {
          setPlaysLoaded(true);
          return;
        }
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
          
          // Check if all plays have the same timestamp (bad data from old bug)
          if (historicalPlays.length > 10) {
            const firstTimestamp = historicalPlays[0].timestamp.getTime();
            const lastTimestamp = historicalPlays[historicalPlays.length - 1].timestamp.getTime();
            const timeDiff = Math.abs(firstTimestamp - lastTimestamp);
            
            if (timeDiff < 60000) { // Less than 1 minute difference = bad data
              console.warn('⚠️ Detected bad timestamp data (all plays have same time). This game needs to be re-saved with wallclock data.');
              console.warn('   Please re-fetch the game data from ESPN and save it again to fix timestamps.');
            }
          }
          
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

  // Shared helper to merge latest play from ESPN situation into playLog without duplicates
  const mergeLatestPlay = (currentEvent: Event | undefined, previousEvent: Event | null) => {
    if (!currentEvent?.competitions?.[0]?.situation?.lastPlay) return;
    const comp = currentEvent.competitions[0];
    if (!comp.situation?.lastPlay) return;
    const currentPlayText = comp.situation.lastPlay.text;
    const previousPlayText = previousEvent?.competitions?.[0]?.situation?.lastPlay?.text;

    if (currentPlayText !== previousPlayText) {
      setPlayLog(prev => {
        const isDuplicate = prev.some(p =>
          p.text === currentPlayText &&
          p.quarter === comp.status.period &&
          p.clock === comp.status.displayClock
        );

        if (!isDuplicate) {
          const possession = comp.situation?.possession;
          const newPlay = {
            text: currentPlayText,
            quarter: comp.status.period,
            clock: comp.status.displayClock,
            timestamp: new Date(),
            yardage: comp.situation?.lastPlay?.statYardage,
            possession: typeof possession === 'object' && possession !== null && 'id' in possession ? (possession as any).id : possession,
            athletesInvolved: comp.situation?.lastPlay?.athletesInvolved
          };
          return [newPlay, ...prev];
        }
        return prev;
      });
    }
  };

  // Unified fetch: resolves test vs live scoreboard and optional summary fallback
  const getGameData = async (gid: string): Promise<{ game?: Event; usedSummaryApi: boolean }> => {
    let game: Event | undefined;
    let usedSummaryApi = false;
    if (gid === 'test') {
      const response = await axios.get('/scoreboard copy 2.json');
      // Support both ESPN scoreboard schema and a wrapped copy (content.sbData.events)
      const topLevelEvents = (response.data as any)?.events;
      const wrappedEvents = (response.data as any)?.content?.sbData?.events;
      const events = Array.isArray(topLevelEvents) ? topLevelEvents : Array.isArray(wrappedEvents) ? wrappedEvents : [];
      game = events?.[0] as Event | undefined;
    } else {
      const scoreboardResponse = await axios.get<ScoreboardResponse>(
        'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'
      );
      game = scoreboardResponse.data.events?.find(e => e.id === gid);
      const gameStatus = game?.competitions[0].status.type.state;
      if (!game || gameStatus !== 'in') {
        try {
          const summaryResponse = await axios.get<Summary>(
            `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gid}`
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
    }
    return { game, usedSummaryApi };
  };

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) return;

      try {
        if (!event) {
          showLoading('Loading game details...');
        } else {
          setIsRefreshing(true);
        }
        setError(null);

        const { game, usedSummaryApi } = await getGameData(gameId);
        
        if (!game) {
          setError('Game data not available');
          hideLoading();
          setIsRefreshing(false);
          return;
        }
        
        mergeLatestPlay(game, event);
        
        // Set nav preset based on which API provided the data
        const preset = usedSummaryApi ? 'summary' : 'scoreboard';
        setNavPreset(preset);
        onPresetChange(preset);
        setEvent(game);
        setLastUpdated(new Date());
        setCountdown(30); // Reset countdown
        hideLoading();
        setIsRefreshing(false);
      } catch (err) {
        console.error('Error fetching game data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load game data');
        hideLoading();
        setIsRefreshing(false);
      }
    };

    fetchGameData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]); // Only re-run when gameId changes

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

          const { game, usedSummaryApi } = await getGameData(gameId);
          
          if (game) {
            mergeLatestPlay(game, event);
            
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, gameId, navPreset]); // Removed event and playLog from dependencies

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
