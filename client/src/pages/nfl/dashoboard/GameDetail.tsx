import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaFootballBall } from 'react-icons/fa';
import axios from 'axios';
import ScoreboardView from '../scoreboard/Scoreboard';
import SummaryView from '../summary/Summary';
import FootballField from '@/components/nfl/FootballField';
import { useLoading } from '@/providers/LoadingContext';

import type { Event, ScoreboardResponse } from '@/types/espn/scoreboard';
import type { Summary } from '@/types/espn/summary';
import { Play } from '@/types/espn/playByplay';

// Firebase Firestore endpoint (assuming you have a backend endpoint)
const FIRESTORE_API = '/api/playbyplay';

interface NFLGameProps {
  activeTab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays' | 'odds' | 'pick' | 'top' | 'yourpicks' | 'schedule' | 'news' | 'dashboard' | 'games';
  onTabChange: (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays' | 'odds' | 'pick' | 'top' | 'yourpicks' | 'schedule' | 'news' | 'dashboard' | 'games') => void;
  onPresetChange: (preset: 'scoreboard' | 'summary') => void;
  onGameStatusChange?: (status: 'pre' | 'in' | 'post') => void;
  onRegisterTabClick?: (callback: (tab: string) => void) => void;
}

const GameDetail: React.FC<NFLGameProps> = ({ activeTab, onTabChange, onPresetChange, onGameStatusChange, onRegisterTabClick }) => {
  const { gameId } = useParams<{ gameId: string }>();
  const { showLoading, hideLoading } = useLoading();
  const [event, setEvent] = useState<Event | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [navPreset, setNavPreset] = useState<'scoreboard' | 'summary'>('scoreboard');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [playLog, setPlayLog] = useState<Play[]>([]);
  const [playsLoaded, setPlaysLoaded] = useState(false);
  
  // Test mode controls
  const [testGameId, setTestGameId] = useState<string>('401772949');
  const [selectedPlayIndex, setSelectedPlayIndex] = useState<number>(0);

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
        // In test mode, use testGameId for loading plays
        const actualGameId = gameId === 'test' ? testGameId : gameId;
        
        showLoading('Loading play history...');
        console.log(`Loading previous plays for game ${actualGameId} from backend API...`);
        
        // Fetch from your backend API that connects to Firebase
        const response = await axios.get(`${FIRESTORE_API}/${actualGameId}`);
        
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
  }, [gameId, testGameId, playsLoaded]); // Re-run when gameId or testGameId changes

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
      console.log('🆕 New play detected:', currentPlayText);
      setPlayLog(prev => {
        const isDuplicate = prev.some(p =>
          p.text === currentPlayText &&
          p.quarter === comp.status.period &&
          p.clock === comp.status.displayClock
        );

        if (!isDuplicate) {
          const possession = comp.situation?.possession;
          const newPlay: Play = {
            text: currentPlayText,
            quarter: comp.status.period,
            clock: comp.status.displayClock,
            timestamp: new Date(),
            yardage: comp.situation?.lastPlay?.statYardage,
            possession: typeof possession === 'object' && possession !== null && 'id' in possession ? (possession as any).id : possession,
            athletesInvolved: comp.situation?.lastPlay?.athletesInvolved,
            type: comp.situation?.lastPlay?.type?.text || 'Play'
          };
          console.log('➕ Adding new play to log:', newPlay);
          return [newPlay, ...prev];
        } else {
          console.log('⏭️ Duplicate play, skipping');
        }
        return prev;
      });
    } else {
      console.log('⏸️ No new plays since last refresh');
    }
  };

  // Unified fetch: resolves test vs live scoreboard and optional summary fallback
  const getGameData = async (gid: string): Promise<{ game?: Event; usedSummaryApi: boolean }> => {
    let game: Event | undefined;
    let usedSummaryApi = false;
    if (gid === 'test') {
      // In test mode, fetch real game data using testGameId
      const scoreboardResponse = await axios.get<ScoreboardResponse>(
        'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'
      );
      game = scoreboardResponse.data.events?.find(e => e.id === testGameId);
      if (!game) {
        // If not in scoreboard, try summary
        try {
          const summaryResponse = await axios.get<Summary>(
            `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${testGameId}`
          );
          setSummary(summaryResponse.data);
          usedSummaryApi = true;
          if (summaryResponse.data.header) {
            game = summaryResponse.data.header as unknown as Event;
          }
        } catch (summaryErr) {
          console.error('Error fetching summary data:', summaryErr);
        }
      }
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
  }, [gameId, testGameId]); // Re-run when gameId or testGameId changes (for test mode)

  // Countdown timer effect for auto-refresh (only for live games)
  useEffect(() => {
    if (!event) return; // Don't start countdown until initial load
    
    // Don't auto-refresh in test mode
    if (gameId === 'test') return;
    
    // Only auto-refresh if using scoreboard API (live games)
    if (navPreset === 'summary') return; // Don't refresh final games
    
    // Handle countdown reaching 0
    if (countdown === 0) {
      console.log('⏰ Countdown reached 0, triggering auto-refresh...');
      
      const fetchGameData = async () => {
        if (!gameId) return;

        try {
          setIsRefreshing(true);
          setError(null);

          console.log('🔄 Fetching fresh game data from API...');
          const { game, usedSummaryApi } = await getGameData(gameId);
          
          if (game) {
            console.log('✅ Game data refreshed, updating state...');
            console.log('📊 Latest play:', game.competitions[0]?.situation?.lastPlay?.text);
            mergeLatestPlay(game, event);
            
            const preset = usedSummaryApi ? 'summary' : 'scoreboard';
            setNavPreset(preset);
            onPresetChange(preset);
            setEvent(game);
            setLastUpdated(new Date());
          }
          
          console.log('✅ Refresh complete, countdown will reset to 30s');
        } catch (err) {
          console.error('❌ Error refreshing game data:', err);
        } finally {
          setIsRefreshing(false);
          // Reset countdown after fetch completes - this will trigger the effect again
          setCountdown(30);
        }
      };

      fetchGameData();
      return; // Don't set up interval when countdown is 0
    }

    // Normal countdown tick - only run when countdown > 0
    const timer = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1;
        console.log(`⏱️ Countdown: ${next}s`);
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, gameId, navPreset]); // Removed event and playLog from dependencies

  const handleManualRefresh = () => {
    setCountdown(0); // Trigger immediate refresh
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bg-darkest to-bg-card flex items-center justify-center pb-20">
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-8 text-center max-w-md">
          <p className="text-red-400 font-bold mb-2 text-lg">Error loading game</p>
          <p className="text-text-light">{error}</p>
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

  // Test mode controls UI
  const isTestMode = gameId === 'test';
  const testControls = isTestMode ? (
    <div className="sticky top-0 z-50 bg-bg-darkest border-b-2 border-neon-cyan shadow-lg">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-text-muted text-xs mb-1 block">Test Game ID</label>
            <input
              type="text"
              value={testGameId}
              onChange={(e) => {
                setTestGameId(e.target.value);
                setPlaysLoaded(false); // Reset to reload plays
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPlaysLoaded(false);
                  window.location.reload();
                }
              }}
              className="w-full bg-bg-darker text-white px-4 py-2 rounded border border-neon-cyan/30 focus:border-neon-cyan outline-none"
              placeholder="Enter ESPN Game ID"
            />
          </div>
          <button
            onClick={() => {
              setPlaysLoaded(false);
              window.location.reload();
            }}
            className="px-6 py-2 bg-neon-cyan text-bg-darkest font-bold rounded hover:bg-neon-cyan/80 transition-colors mt-5"
          >
            Load Game
          </button>
        </div>
        {playLog.length > 0 && (
          <div className="mt-4">
            <label className="text-text-muted text-xs mb-1 block">
              Emulate Current Play ({playLog.length} plays available)
            </label>
            <select
              value={selectedPlayIndex}
              onChange={(e) => setSelectedPlayIndex(Number(e.target.value))}
              className="w-full bg-bg-darker text-white px-4 py-2 rounded border border-neon-pink/30 focus:border-neon-pink outline-none"
            >
              {playLog.map((play, index) => (
                <option key={index} value={index}>
                  Q{play.quarter} {play.clock} - {typeof play.type === 'string' ? play.type : (play.type as any)?.text || 'Play'} - {play.text.substring(0, 80)}...
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  ) : null;

  // In test mode, override the current play based on selection
  const effectivePlayLog = isTestMode && playLog.length > 0 ? [playLog[selectedPlayIndex]] : playLog;
  const effectiveEvent = isTestMode && event && playLog.length > 0 ? {
    ...event,
    competitions: event.competitions.map(comp => {
      const selectedPlay = playLog[selectedPlayIndex];
      // Convert Play to LastPlay format - handle both string and object type
      const playTypeText = typeof selectedPlay.type === 'string' 
        ? selectedPlay.type 
        : (selectedPlay.type as any)?.text || 'Play';
      
      // Calculate start and end yard lines for field visualization
      const startYardLine = selectedPlay.yardLine || 50; // Default to midfield if not available
      const yardage = selectedPlay.yardage || 0;
      const endYardLine = Math.max(0, Math.min(100, startYardLine + yardage)); // Keep within 0-100
      
      const lastPlay = {
        id: `play-${selectedPlayIndex}`,
        type: {
          id: String(selectedPlay.type || 'play'),
          text: playTypeText,
          abbreviation: playTypeText.substring(0, 3)
        },
        text: selectedPlay.text,
        scoreValue: selectedPlay.scoreValue || 0,
        team: {
          id: selectedPlay.possession || selectedPlay.team || ''
        },
        start: { yardLine: startYardLine },
        end: { yardLine: endYardLine },
        statYardage: selectedPlay.yardage,
        athletesInvolved: selectedPlay.athletesInvolved
      };
      
      return {
        ...comp,
        situation: {
          ...comp.situation,
          lastPlay
        }
      };
    })
  } as Event : event;

  // Test mode football field visualization - must be after effectiveEvent is defined
  const testFieldVisualization = isTestMode && event && playLog.length > 0 && effectiveEvent ? (
    <div className="mx-2 my-4">
      <div className="bg-bg-dark/50 rounded-lg p-4 border border-neon-cyan/20">
        <h3 className="text-neon-cyan font-bold text-lg mb-4">Football Field Animation Test</h3>
        <FootballField
          homeTeam={effectiveEvent.competitions[0].competitors.find((c: any) => c.homeAway === 'home')}
          awayTeam={effectiveEvent.competitions[0].competitors.find((c: any) => c.homeAway === 'away')}
          lastPlay={effectiveEvent.competitions[0].situation?.lastPlay}
          situation={effectiveEvent.competitions[0].situation}
          getTeamLogo={getTeamLogo}
        />
      </div>
    </div>
  ) : null;

  // Render the appropriate view based on navPreset
  if (navPreset === 'scoreboard') {
    return (
      <>
        {testControls}
        {testFieldVisualization}
        <ScoreboardView
          event={effectiveEvent || event}
          activeTab={activeTab}
          onTabChange={onTabChange}
          getTeamLogo={getTeamLogo}
          playLog={effectivePlayLog}
          lastUpdated={lastUpdated}
          countdown={countdown}
          isRefreshing={isRefreshing}
          onManualRefresh={() => setCountdown(0)}
        />
      </>
    );
  }

  return (
    <>
      {testControls}
      {testFieldVisualization}
      <SummaryView
        event={effectiveEvent || event}
        summary={summary}
        activeTab={activeTab}
        onTabChange={onTabChange}
        getTeamLogo={getTeamLogo}
        playLog={effectivePlayLog}
        gameId={gameId || ''}
      />
    </>
  );
};

export default GameDetail;
