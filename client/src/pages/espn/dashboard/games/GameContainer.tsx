import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { FaFootballBall } from 'react-icons/fa';
import axios from 'axios';
import ScoreboardView from '../../scoreboard/Carousel';
import SummaryView from '../../summary/Summary';
import FootballField from '@/pages/espn/dashboard/games/FootballField';
import BasketballCourt from '@/pages/espn/dashboard/games/BasketballCourt';
import { useLoading } from '@/providers/LoadingContext';
import { useLeague } from '@/providers/LeagueContext';
import { debugLog } from '@/utils/debugLog';
import { fetchEspnPlays } from '@/utils/espnPlays';
import { getScoreboardUrl, getSummaryUrl } from '@/utils/espnApi';
import { getHeadshotUrl as getHeadshotUrlUtil } from '@/utils/espnImages';
import { PlaysProvider } from '@/providers/PlaysContext';

import type { Event, ScoreboardResponse } from '@/types/espn/scoreboard';
import type { Summary } from '@/types/espn/summary';
import { PlayNfl } from '@/types/espn/plays';

interface GameContainerProps {
  activeTab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays' | 'odds' | 'pick' | 'yourpicks' | 'schedule' | 'news' | 'dashboard' | 'games' | 'chat';
  onTabChange: (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays' | 'odds' | 'pick' | 'yourpicks' | 'schedule' | 'news' | 'dashboard' | 'games' | 'chat') => void;
  onPresetChange: (preset: 'scoreboard' | 'summary') => void;
  onGameStatusChange?: (status: 'pre' | 'in' | 'post') => void;
  onRegisterTabClick?: (callback: (tab: string) => void) => void;
}

const GameContainer: React.FC<GameContainerProps> = ({ activeTab, onTabChange, onPresetChange, onGameStatusChange, onRegisterTabClick }) => {
  const { gameId } = useParams<{ gameId: string }>();
  const { showLoading, hideLoading } = useLoading();
  const location = useLocation();
  useLeague();
  
  // Derive league from URL path as primary source to avoid race conditions
  const urlLeague = window.location.pathname.startsWith('/nba') ? 'nba' : 'nfl';
  const league = urlLeague; // Use URL-derived league to ensure accuracy
  
  const [event, setEvent] = useState<Event | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [navPreset, setNavPreset] = useState<'scoreboard' | 'summary'>('scoreboard');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [playLog, setPlayLog] = useState<PlayNfl[]>([]);
  const [playsLoaded, setPlaysLoaded] = useState(false);
  const [currentLeague, setCurrentLeague] = useState<string>(league);
  
  // Test mode controls - league-aware default game IDs
  const defaultTestGameId = league === 'nba' ? '401810277' : '401772804';
  const [testGameId, setTestGameId] = useState<string>(defaultTestGameId);
  const [selectedPlayIndex, setSelectedPlayIndex] = useState<number>(0);

  // Update testGameId when league changes
  useEffect(() => {
    setTestGameId(league === 'nba' ? '401810277' : '401772804');
  }, [league]);

  // Reset state when league changes to prevent using old game IDs with new league
  useEffect(() => {
    if (currentLeague !== league) {
      debugLog(`League changed from ${currentLeague} to ${league}, clearing game state`);
      setEvent(null);
      setSummary(null);
      setPlayLog([]);
      setPlaysLoaded(false);
      setError(null);
      setCurrentLeague(league);
      // Clear any cached data for the old game
      if (gameId) {
        localStorage.removeItem(`playlog_${gameId}`);
      }
    }
  }, [league, currentLeague, gameId]);

  // Check for tab state and switch tabs if passed via navigation state
  useEffect(() => {
    const state = location.state as { tab?: string } | null;
    if (state?.tab === 'yourpicks') {
      onTabChange('yourpicks' as any);
    }
  }, [location.state, onTabChange]);

  const refreshPlaysFromApi = useCallback(async () => {
    if (!gameId) return;

    // Only fetch plays for in-progress or completed games
    const status = event?.status?.type?.state;
    if (status !== 'in' && status !== 'post') {
      debugLog('⏸ Skipping plays refresh: game not started yet');
      return;
    }

    const cacheKey = `playlog_${gameId}`;
    const actualGameId = gameId === 'test' ? testGameId : gameId;
    const compId = event?.competitions?.[0]?.id || actualGameId;

    try {
      setIsRefreshing(true);
      const latestPlays = await fetchEspnPlays(
        actualGameId,
        String(compId),
        undefined,
        league,
        (opts) => getHeadshotUrlUtil(opts, league as 'nfl' | 'nba')
      );

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
  }, [event, gameId, testGameId, league]);

  // Load previous plays from ESPN plays endpoint on mount
  useEffect(() => {
    const loadPreviousPlays = async () => {
      if (!gameId || playsLoaded) return;

      // Only fetch plays for in-progress or completed games
      const status = event?.status?.type?.state;
      if (status !== 'in' && status !== 'post') {
        debugLog('⏸ Skipping pregame plays fetch');
        setPlayLog([]);
        setPlaysLoaded(true);
        return;
      }

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
        const historicalPlays = await fetchEspnPlays(
          actualGameId,
          String(compId),
          undefined,
          league,
          (opts) => getHeadshotUrlUtil(opts, league as 'nfl' | 'nba')
        );

        // Cache the data
        localStorage.setItem(cacheKey, JSON.stringify({
          plays: historicalPlays,
          timestamp: Date.now()
        }));
        
        setPlayLog(historicalPlays);
        setPlaysLoaded(true);
        debugLog(`✅ Loaded ${historicalPlays.length} historical plays from ESPN`);
      } catch (error: any) {
        // Silently handle 404 errors for old games no longer in ESPN API
        if (error?.response?.status === 404) {
          debugLog(`⚠️ Game ${gameId} not found in ESPN API (likely an old game) - continuing without plays`);
        } else {
          console.error('Error loading previous plays:', error);
        }
        // Set empty play log and mark as loaded to prevent infinite retries
        setPlayLog([]);
        setPlaysLoaded(true);
      } finally {
        hideLoading();
      }
    };

    loadPreviousPlays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, testGameId, playsLoaded, league]); // Re-run when gameId or testGameId changes

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
          const newPlay: PlayNfl = {
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
        getScoreboardUrl(league)
      );
      game = scoreboardResponse.data.events?.find(e => e.id === testGameId);
      if (!game) {
        // If not in scoreboard, try summary
        try {
          const summaryResponse = await axios.get<Summary>(
            getSummaryUrl(league, testGameId)
          );
          setSummary(summaryResponse.data);
          usedSummaryApi = true;
          if (summaryResponse.data.header) {
            game = summaryResponse.data.header as unknown as Event;
          }
        } catch (summaryErr: any) {
          if (summaryErr?.response?.status === 404) {
            debugLog(`⚠️ Summary not found for game ${gid} (404) - likely an old game`);
          } else {
            console.error('Error fetching summary data:', summaryErr);
          }
        }
      }
    } else {
      const scoreboardResponse = await axios.get<ScoreboardResponse>(
        getScoreboardUrl(league)
      );
      game = scoreboardResponse.data.events?.find(e => e.id === gid);
      const gameStatus = game?.competitions[0].status.type.state;
      
      // Fetch summary for pregame and finished games (skip only while live)
      if (!game || gameStatus !== 'in') {
        try {
          const summaryResponse = await axios.get<Summary>(
            getSummaryUrl(league, gid)
          );
          setSummary(summaryResponse.data);
          usedSummaryApi = true;
          if (!game && summaryResponse.data.header) {
            game = summaryResponse.data.header as unknown as Event;
          }
        } catch (summaryErr: any) {
          if (summaryErr?.response?.status === 404) {
            debugLog(`⚠️ Summary not found for game ${gid} (404) - likely an old game`);
          } else {
            console.error('Error fetching summary data:', summaryErr);
          }
        }
      } else {
        debugLog(`Skipping summary API for live game ${gid} (status: ${gameStatus})`);
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
          // For old games, show a message but don't block the UI
          debugLog(`⚠️ Game ${gameId} not available from ESPN API - may be an old game`);
          setError('This game is no longer available in ESPN API. Showing cached data only.');
          hideLoading();
          setIsRefreshing(false);
          // Don't return - let the component render with whatever data we have
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
  const homeCompetitor = competition?.competitors?.find((c: any) => c.homeAway === 'home');
  const awayCompetitor = competition?.competitors?.find((c: any) => c.homeAway === 'away');
  const homeScore = homeCompetitor?.score !== undefined ? Number(homeCompetitor.score) : undefined;
  const awayScore = awayCompetitor?.score !== undefined ? Number(awayCompetitor.score) : undefined;
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

  // Orientation: away left, home right; switch at Q3
  const currentQuarterForField = effectivePlayLog?.[0]?.quarter ?? competition?.status?.period ?? 1;
  const switchAtQ3 = (currentQuarterForField ?? 1) >= 3;
  const leftOverride = switchAtQ3 ? homeCompetitor : awayCompetitor;
  const rightOverride = switchAtQ3 ? awayCompetitor : homeCompetitor;

  // Test mode field visualization - must be after effectiveEvent is defined
  const testFieldVisualization = isTestMode && event && playLog.length > 0 && effectiveEvent ? (
    <div className="mx-2 my-4">
      <div className="bg-bg-dark/50 rounded-lg p-4 border border-neon-cyan/20">
        <h3 className="text-neon-cyan font-bold text-lg mb-4">
          {league === 'nba' ? 'Basketball Court Animation Test' : 'Football Field Animation Test'}
        </h3>
        {league === 'nba' ? (
          <BasketballCourt
            homeTeam={effectiveEvent.competitions[0].competitors.find((c: any) => c.homeAway === 'home')}
            awayTeam={effectiveEvent.competitions[0].competitors.find((c: any) => c.homeAway === 'away')}
            lastPlay={effectiveEvent.competitions[0].situation?.lastPlay}
            getTeamLogo={getTeamLogo}
          />
        ) : (
          <FootballField
            homeTeam={effectiveEvent.competitions[0].competitors.find((c: any) => c.homeAway === 'home')}
            awayTeam={effectiveEvent.competitions[0].competitors.find((c: any) => c.homeAway === 'away')}
            lastPlay={effectiveEvent.competitions[0].situation?.lastPlay}
            situation={situationForField}
            leftTeamOverride={leftOverride}
            rightTeamOverride={rightOverride}
            getTeamLogo={getTeamLogo}
          />
        )}
      </div>
    </div>
  ) : null;

  // Render the appropriate view based on navPreset
  const playContextValue = {
    playLog: effectivePlayLog,
    lastUpdated,
    isRefreshing,
    countdown,
    homeScore,
    awayScore,
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

export default GameContainer;
