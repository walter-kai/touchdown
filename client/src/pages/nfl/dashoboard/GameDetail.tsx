import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FaFootballBall } from 'react-icons/fa';
import axios from 'axios';
import ScoreboardView from '../scoreboard/Scoreboard';
import SummaryView from '../summary/Summary';
import FootballField from '@/components/nfl/FootballField';
import { useLoading } from '@/providers/LoadingContext';
import { debugLog } from '@/utils/debugLog';
import { fetchEspnPlays } from '@/utils/espnPlays';
import { PlaysProvider } from '@/providers/PlaysContext';

import type { Event, ScoreboardResponse } from '@/types/espn/scoreboard';
import type { Summary } from '@/types/espn/summary';
import { Play } from '@/types/espn/playByplay';

interface NFLGameProps {
  activeTab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays' | 'odds' | 'pick' | 'yourpicks' | 'schedule' | 'news' | 'dashboard' | 'games';
  onTabChange: (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays' | 'odds' | 'pick' | 'yourpicks' | 'schedule' | 'news' | 'dashboard' | 'games') => void;
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

  const refreshPlaysFromApi = useCallback(async () => {
    if (!gameId) return;

    const cacheKey = `playlog_${gameId}`;
    const actualGameId = gameId === 'test' ? testGameId : gameId;
    const compId = event?.competitions?.[0]?.id || actualGameId;

    try {
      setIsRefreshing(true);
      const latestPlays = await fetchEspnPlays(actualGameId, String(compId));

      // cache latest pulls for quick resume
      localStorage.setItem(cacheKey, JSON.stringify({ plays: latestPlays, timestamp: Date.now() }));
      setPlayLog(latestPlays);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error refreshing plays from ESPN:', err);
    } finally {
      setIsRefreshing(false);
      setCountdown(30);
    }
  }, [event, gameId, testGameId]);

  // Load previous plays from ESPN plays endpoint on mount
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
            debugLog(`✅ Using cached plays (${plays.length} plays, ${Math.round(cacheAge / 1000)}s old)`);
            const historicalPlays = plays.map((play: any) => ({
              ...play,
              timestamp: new Date(play.timestamp)
            }));
            setPlayLog(historicalPlays);
            setPlaysLoaded(true);
            return;
          } else {
            debugLog('Cache expired, fetching fresh data...');
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
        debugLog(`Loading previous plays for game ${actualGameId} from ESPN plays API...`);

        const compId = event?.competitions?.[0]?.id || actualGameId;
        const historicalPlays = await fetchEspnPlays(actualGameId, String(compId));

        // Cache the data
        localStorage.setItem(cacheKey, JSON.stringify({
          plays: historicalPlays,
          timestamp: Date.now()
        }));
        
        setPlayLog(historicalPlays);
        setPlaysLoaded(true);
        debugLog(`✅ Loaded ${historicalPlays.length} historical plays from ESPN`);
      } catch (error: any) {
        console.error('Error loading previous plays:', error);
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
        debugLog('Game status being sent to parent:', gameState);
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
      debugLog('🆕 New play detected:', currentPlayText);
      setPlayLog(prev => {
        const period = comp.status.period ?? 0;
        const clock = comp.status.displayClock ?? '';
        const playText = currentPlayText ?? '';
        if (!playText) return prev;

        const isDuplicate = prev.some(p =>
          p.text === playText &&
          p.quarter === period &&
          p.clock === clock
        );

        if (!isDuplicate) {
          const possession = comp.situation?.possession;
          const newPlay: Play = {
            text: playText,
            quarter: period,
            clock,
            timestamp: new Date(),
            yardage: comp.situation?.lastPlay?.statYardage,
            possession: typeof possession === 'object' && possession !== null && 'id' in possession ? (possession as any).id : possession,
            athletesInvolved: comp.situation?.lastPlay?.athletesInvolved,
            type: comp.situation?.lastPlay?.type?.text || 'Play'
          };
          debugLog('➕ Adding new play to log:', newPlay);
          return [newPlay, ...prev];
        } else {
          debugLog('⏭️ Duplicate play, skipping');
        }
        return prev;
      });
    } else {
      debugLog('⏸️ No new plays since last refresh');
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

  // Derive competition + latest play for live/final handling
  const competitionLive = event?.competitions?.[0];
  const latestPlay = playLog?.[0];
  const latestPlayTypeText = typeof latestPlay?.type === 'string'
    ? latestPlay.type
    : (latestPlay?.type as any)?.text || (latestPlay?.type as any)?.displayName || '';
  const isGameFinal = (competitionLive?.status?.type?.state === 'post') || /end of.*game|final/i.test(latestPlayTypeText || latestPlay?.text || '');

  // Countdown timer effect for auto-refresh (only while game is live)
  useEffect(() => {
    if (!gameId || isGameFinal) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          debugLog('⏰ Countdown reached 0, refreshing plays from ESPN API...');
          refreshPlaysFromApi();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameId, refreshPlaysFromApi, isGameFinal]);

  // When game ends, stop refreshing and switch to summary preset
  useEffect(() => {
    if (isGameFinal) {
      setCountdown(0);
      setIsRefreshing(false);
      setNavPreset('summary');
      onPresetChange('summary');
    }
  }, [isGameFinal, onPresetChange]);

  const handleManualRefresh = () => {
    if (isGameFinal) return;
    refreshPlaysFromApi();
    setCountdown(30);
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
      // Parse yardage from text if not available: "for X yards"
      let yardage = selectedPlay.yardage || 0;
      if (!yardage && selectedPlay.text) {
        const match = selectedPlay.text.match(/for (-?\d+) yard/i);
        if (match) {
          yardage = parseInt(match[1]);
        }
      }
      
      // Parse end yard line from text if not available: "to TEAM XX"
      let endYardLine = selectedPlay.yardLine || 50;
      if (!selectedPlay.yardLine && selectedPlay.text) {
        const match = selectedPlay.text.match(/to \w+ (\d+)/i);
        if (match) {
          endYardLine = parseInt(match[1]);
        }
      }
      
      const startYardLine = Math.max(0, Math.min(100, endYardLine - yardage)); // Work backwards from end
      
      debugLog('Play yard calculation:', { 
        text: selectedPlay.text,
        yardage, 
        endYardLine, 
        startYardLine,
        rawYardLine: selectedPlay.yardLine 
      });
      
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

  // Narrow situation shape for FootballField (it only needs possession + down/distance + timeouts)
  const competition = effectiveEvent?.competitions?.[0];
  const situationForField = competition?.situation
    ? {
        downDistanceText: competition.situation.downDistanceText,
        possession: competition.situation.possession as any,
        awayTimeouts: competition.situation.awayTimeouts,
        homeTimeouts: competition.situation.homeTimeouts,
        lastPlay: competition.situation.lastPlay
          ? { possession: (competition.situation.lastPlay as any).possession }
          : undefined,
      }
    : undefined;

  // Test mode football field visualization - must be after effectiveEvent is defined
  const testFieldVisualization = isTestMode && event && playLog.length > 0 && effectiveEvent ? (
    <div className="mx-2 my-4">
      <div className="bg-bg-dark/50 rounded-lg p-4 border border-neon-cyan/20">
        <h3 className="text-neon-cyan font-bold text-lg mb-4">Football Field Animation Test</h3>
        <FootballField
          homeTeam={effectiveEvent.competitions[0].competitors.find((c: any) => c.homeAway === 'home')}
          awayTeam={effectiveEvent.competitions[0].competitors.find((c: any) => c.homeAway === 'away')}
          lastPlay={effectiveEvent.competitions[0].situation?.lastPlay}
          situation={situationForField}
          getTeamLogo={getTeamLogo}
        />
      </div>
    </div>
  ) : null;

  // Render the appropriate view based on navPreset
  const playContextValue = {
    playLog: effectivePlayLog,
    lastUpdated,
    isRefreshing,
    countdown,
    refresh: handleManualRefresh
  };

  if (navPreset === 'scoreboard') {
    return (
      <PlaysProvider {...playContextValue}>
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
      </PlaysProvider>
    );
  }

  return (
    <PlaysProvider {...playContextValue}>
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
    </PlaysProvider>
  );
};

export default GameDetail;
