'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaFootballBall, FaTrophy, FaChartBar, FaChartLine, FaUsers, FaTimes, FaClipboardList, FaClock, FaListAlt } from 'react-icons/fa';
import FootballField from '@/views/espn/scoreboard/visuals/FootballField';
import BasketballCourt from '@/views/espn/scoreboard/visuals/BasketballCourt';
import ChoosePicks from '@/views/espn/scoreboard/ChoosePicks';
import type { PlayNfl } from '@/types/espn/plays';
import PlayLog from '@/components/espn/PlayLog';
import PointsChart from '@/components/espn/PointsChart';
import { CountUpScore } from '@/components/common/CountUpScore';
import { usePlays } from '@/providers/PlaysContext';
import { useAuth } from '@/providers/AuthContext';
import { getHeadshotUrl } from '@/utils/espnImages';
import type { Summary } from '@/types/espn/summary';

const NBA_REGULATION_SECONDS = 12 * 60;
const NBA_OT_SECONDS = 5 * 60;
const RUN_WINDOW_SECONDS = 240; // 4 minutes of game time

const clockToSeconds = (clock: string): number => {
  if (!clock) return 0;
  const parts = clock.split(':').map(part => Number(part));
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number.isFinite(Number(clock)) ? Number(clock) : 0;
};

const elapsedGameSeconds = (quarter: number, clock: string): number => {
  const q = Number.isFinite(quarter) && quarter > 0 ? quarter : 1;
  const clockSeconds = clockToSeconds(clock);
  const periodLength = q <= 4 ? NBA_REGULATION_SECONDS : NBA_OT_SECONDS;
  const boundedClock = Math.max(0, Math.min(periodLength, clockSeconds));
  let elapsed = 0;
  for (let p = 1; p < q; p += 1) {
    elapsed += p <= 4 ? NBA_REGULATION_SECONDS : NBA_OT_SECONDS;
  }
  return elapsed + (periodLength - boundedClock);
};

const formatDuration = (totalSeconds: number): string => {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
};

interface InfoProps {
  homeTeam: any;
  awayTeam: any;
  competition: any;
  getTeamLogo: (team: any) => string;
  gameCountdown?: number;
  summary?: Summary | null;
  gameId?: string;
  countdown?: number;
  playLog: PlayNfl[];
  homeTeamId?: string;
  awayTeamId?: string;
  onOpenPicks?: () => void;
  modalView: 'prediction' | 'leaders' | 'stats' | 'scoring' | null;
  setModalView: (view: 'prediction' | 'leaders' | 'stats' | 'scoring' | null) => void;
}

const Info: React.FC<InfoProps> = ({
  homeTeam,
  awayTeam,
  competition,
  getTeamLogo,
  gameCountdown = 0,
  summary,
  gameId,
  playLog,
  countdown = 30,
  homeTeamId,
  awayTeamId,
  onOpenPicks,
  modalView,
  setModalView,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { homeScore: contextHomeScore, awayScore: contextAwayScore } = usePlays();
  const currentHomeScore = contextHomeScore ?? (homeTeam?.score !== undefined ? Number(homeTeam.score) : 0);
  const currentAwayScore = contextAwayScore ?? (awayTeam?.score !== undefined ? Number(awayTeam.score) : 0);
  const resolvedHomeTeamId = homeTeamId || homeTeam?.team?.id || homeTeam?.id;
  const resolvedAwayTeamId = awayTeamId || awayTeam?.team?.id || awayTeam?.id;

  // Derive league from URL to avoid race condition with LeagueContext
  const urlLeague = window.location.pathname.startsWith('/nba') ? 'nba' : 'nfl';
  const isNba = urlLeague === 'nba';

  const [currentPicks, setCurrentPicks] = useState<any[]>([]);
  const [picksScores, setPicksScores] = useState<Record<string, number>>({});
  const [hasFetchedUserScores, setHasFetchedUserScores] = useState(false);
  const [scoreIncreasePlayerIds, setScoreIncreasePlayerIds] = useState<Set<string>>(new Set());
  const [gameLeaderboard, setGameLeaderboard] = useState<any>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [gameDataNotFound, setGameDataNotFound] = useState(false);
  const [activeContentView, setActiveContentView] = useState<'picks' | 'timeline' | 'playlog'>('picks');
  const playerPickRef = useRef<{ openRoster: () => void }>(null);

  // Load picks from Firebase/API and localStorage
  useEffect(() => {
    if (!gameId || !user) return;
    
    const loadPicks = async () => {
      try {
        // Try to fetch from Firebase via API
        const token = localStorage.getItem('dexter_access_token');
        if (!token) {
          console.log('No auth token found, skipping API fetch');
          throw new Error('No token');
        }
        
        const response = await fetch(`/api/picks/game/${gameId}/user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // API returns { ok: true, picks: { picks: [...], lastUpdated, totalPicks } }
          if (data.picks && data.picks.picks && data.picks.picks.length > 0) {
            // Use the latest pick submission
            const latestPick = data.picks.picks[0];
            const players = latestPick.players || [];
            
            if (players.length > 0) {
              setCurrentPicks(players);
              
              // Calculate MY SCORE (session score - only plays after lock time)
              const pickLockTime = latestPick.timestamp;
              const lockTimeMs = typeof pickLockTime === 'string' ? new Date(pickLockTime).getTime() : pickLockTime;
              
              const scores: Record<string, number> = {};
              players.forEach((player: any) => {
                scores[player.id] = 0;
                playLog.forEach(play => {
                  if (play.athletesInvolved?.some((a: any) => a?.id === player.id)) {
                    const playTimeMs = play.timestamp instanceof Date ? play.timestamp.getTime() : new Date(play.timestamp).getTime();
                    if (playTimeMs >= lockTimeMs) {
                      scores[player.id]++;
                    }
                  }
                });
              });
              setPicksScores(scores);
              return;
            }
          }
        }
      } catch (e) {
        console.error('Error fetching picks from API:', e);
      }
      
      // Fallback to localStorage if API fails
      if (resolvedHomeTeamId && resolvedAwayTeamId) {
        const savedState = localStorage.getItem(`playerPick_${resolvedHomeTeamId}_${resolvedAwayTeamId}`);
        if (savedState) {
          try {
            const parsed = JSON.parse(savedState);
            if (parsed.players && parsed.players.length > 0) {
              setCurrentPicks(parsed.players);
              
              // Calculate MY SCORE (session score - only plays after lock time)
              const pickLockTime = parsed.lockedAt;
              const lockTimeMs = typeof pickLockTime === 'number' ? pickLockTime : new Date(pickLockTime).getTime();
              
              const scores: Record<string, number> = {};
              parsed.players.forEach((player: any) => {
                scores[player.id] = 0;
                playLog.forEach(play => {
                  if (play.athletesInvolved?.some((a: any) => a?.id === player.id)) {
                    const playTimeMs = play.timestamp instanceof Date ? play.timestamp.getTime() : new Date(play.timestamp).getTime();
                    if (playTimeMs >= lockTimeMs) {
                      scores[player.id]++;
                    }
                  }
                });
              });
              setPicksScores(scores);
              return;
            }
          } catch (e) {
            console.error('Error loading picks from localStorage:', e);
          }
        }
      }
      
      // No picks found
      setCurrentPicks([]);
      setPicksScores({});
    };
    
    // Load immediately
    loadPicks();
    
    // Listen for custom event from same tab when picks are saved
    const handleLocalUpdate = (e: CustomEvent) => {
      if (e.detail.key === `playerPick_${resolvedHomeTeamId}_${resolvedAwayTeamId}`) {
        loadPicks();
      }
    };
    
    window.addEventListener('localStorageUpdate' as any, handleLocalUpdate);
    
    return () => {
      window.removeEventListener('localStorageUpdate' as any, handleLocalUpdate);
    };
  }, [gameId, user, playLog, resolvedHomeTeamId, resolvedAwayTeamId]);

  // Recalculate pick scores whenever playLog updates
  useEffect(() => {
    if (!currentPicks || currentPicks.length === 0 || !playLog) return;
    
    const scores: Record<string, number> = {};
    currentPicks.forEach((player: any) => {
      scores[player.id] = 0;
      playLog.forEach(play => {
        if (play.athletesInvolved?.some((a: any) => a?.id === player.id)) {
          scores[player.id]++;
        }
      });
    });
    setPicksScores(scores);
  }, [currentPicks, playLog]);

  // Track score increases and show animation
  const prevScoresRef = useRef<Record<string, number>>({});
  
  useEffect(() => {
    const prevScores = prevScoresRef.current;
    const newIncreases = new Set<string>();
    
    Object.entries(picksScores).forEach(([playerId, newScore]) => {
      const prevScore = prevScores[playerId] ?? 0;
      if (newScore > prevScore) {
        newIncreases.add(playerId);
      }
    });
    
    if (newIncreases.size > 0) {
      setScoreIncreasePlayerIds(newIncreases);
      
      // Clear animation after 2 seconds
      const timer = setTimeout(() => {
        setScoreIncreasePlayerIds(new Set());
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    prevScoresRef.current = picksScores;
  }, [picksScores]);

  // Fetch game leaderboard
  useEffect(() => {
    const fetchGameLeaderboard = async () => {
      if (!gameId) {
        console.log('[Leaderboard] No gameId provided');
        return;
      }
      try {
        setLeaderboardLoading(true);
        setGameDataNotFound(false);
        // Determine league from URL
        const pathLeague = window.location.pathname.startsWith('/nba') ? 'nba' : 'nfl';
        const endpoint = `/api/game-data/${pathLeague}/${gameId}`;
        console.log('[Leaderboard] Fetching from', endpoint);
        const response = await fetch(endpoint);
        console.log('[Leaderboard] Response status:', response.status);
        if (response.status === 404) {
          console.log('[Leaderboard] Game data not found (404)');
          setGameDataNotFound(true);
          setGameLeaderboard(null);
        } else if (response.ok) {
          const data = await response.json();
          console.log('[Leaderboard] Data received:', data);
          // Game data structure: { ok: true, docId, leaderboard: { entries: [...], totalUsers, lastCalculated }, ... }
          if (data.ok && data.leaderboard && data.leaderboard.entries) {
            console.log('[Leaderboard] Setting leaderboard with', data.leaderboard.entries.length, 'entries');
            setGameLeaderboard({
              ok: true,
              leaderboard: data.leaderboard.entries,
              totalUsers: data.leaderboard.totalUsers
            });
            setGameDataNotFound(false);
          } else {
            console.log('[Leaderboard] No leaderboard data in response:', data);
          }
        } else {
          console.warn('[Leaderboard] Response not ok, status:', response.status);
        }
      } catch (err) {
        console.warn('[Leaderboard] Failed to fetch game leaderboard:', err);
      } finally {
        setLeaderboardLoading(false);
      }
    };
    fetchGameLeaderboard();
  }, [gameId]);

  // Update picks display when playLog changes (already handled in useEffect above)
  // No need to fetch from backend - use session scores calculated from playLog

  const nbaRun = useMemo(() => {
    if (!isNba || !homeTeam?.id || !awayTeam?.id || !Array.isArray(playLog) || playLog.length === 0) return null;

    const scoringPlays = playLog.filter(play => {
      const points = Number(play?.scoreValue ?? 0);
      const teamId = play?.team || play?.possession;
      return points > 0 && !!teamId;
    });

    if (scoringPlays.length === 0) return null;

    const latest = scoringPlays[0];
    const latestElapsed = elapsedGameSeconds(Number(latest.quarter || 0), latest.clock || '0:00');

    const windowPlays = scoringPlays.filter(play => {
      const elapsed = elapsedGameSeconds(Number(play.quarter || 0), play.clock || '0:00');
      return latestElapsed - elapsed <= RUN_WINDOW_SECONDS;
    });

    if (windowPlays.length === 0) return null;

    const totals: Record<string, number> = {};
    windowPlays.forEach(play => {
      const teamId = play.team || play.possession;
      if (!teamId) return;
      const points = Number(play.scoreValue || 0);
      if (!Number.isFinite(points) || points <= 0) return;
      totals[teamId] = (totals[teamId] || 0) + points;
    });

    const homePoints = totals[homeTeam.id] || 0;
    const awayPoints = totals[awayTeam.id] || 0;
    if (homePoints === awayPoints || (homePoints === 0 && awayPoints === 0)) return null;

    const runTeamId = homePoints > awayPoints ? homeTeam.id : awayTeam.id;
    const runPoints = runTeamId === homeTeam.id ? homePoints : awayPoints;
    const oppPoints = runTeamId === homeTeam.id ? awayPoints : homePoints;

    const earliestElapsed = Math.min(
      ...windowPlays.map(play => elapsedGameSeconds(Number(play.quarter || 0), play.clock || '0:00'))
    );
    const durationSeconds = Math.max(5, latestElapsed - earliestElapsed);

    return {
      teamId: runTeamId,
      runPoints,
      oppPoints,
      durationLabel: formatDuration(durationSeconds)
    };
  }, [isNba, homeTeam?.id, awayTeam?.id, playLog]);

  const runTeam = nbaRun ? (nbaRun.teamId === homeTeam?.id ? homeTeam : awayTeam) : null;

  // Calculate scoring plays for PointsChart
  const scoringPlays = useMemo(() => {
    const plays: Array<{
      text: string;
      quarter: number;
      clock: string;
      timestamp: Date;
      homeScore?: number;
      awayScore?: number;
    }> = [];
    
    let currentHomeScore = 0;
    let currentAwayScore = 0;
    
    playLog.forEach((play) => {
      const text = play.text.toLowerCase();
      const isScoring = 
        text.includes('touchdown') || 
        text.includes('field goal') || 
        text.includes('safety') ||
        text.includes('extra point') ||
        text.includes('two point') ||
        text.includes('pat ') ||
        text.includes('made') ||  // For NBA shots
        text.includes('free throw');
      
      if (isScoring) {
        // Determine which team scored based on possession
        const isHomeTeamPlay = play.possession === homeTeam?.id;
        
        // Calculate points based on play text
        let points = 0;
        if (isNba) {
          // NBA scoring
          if (text.includes('3-pt')) points = 3;
          else if (text.includes('free throw') && text.includes('made')) points = 1;
          else if (text.includes('made')) points = 2;
        } else {
          // NFL scoring
          if (text.includes('touchdown')) points = 6;
          else if (text.includes('field goal')) points = 3;
          else if (text.includes('safety')) points = 2;
          else if (text.includes('extra point') || text.includes('pat ')) points = 1;
          else if (text.includes('two point')) points = 2;
        }
        
        // Update scores
        if (isHomeTeamPlay) {
          currentHomeScore += points;
        } else {
          currentAwayScore += points;
        }
        
        plays.push({
          text: play.text,
          quarter: play.quarter,
          clock: play.clock,
          timestamp: typeof play.timestamp === 'string' ? new Date(play.timestamp) : play.timestamp,
          homeScore: currentHomeScore,
          awayScore: currentAwayScore
        });
      }
    });
    
    return plays;
  }, [playLog, homeTeam?.id, isNba]);

  const latestPlay: PlayNfl | undefined = playLog?.[0];
  const latestPlayType = typeof latestPlay?.type === 'string'
    ? latestPlay.type
    : (latestPlay?.type as any)?.text || (latestPlay?.type as any)?.displayName || '';
  const compState = competition.status?.type?.state ?? '';
  const livePeriod = latestPlay?.quarter ?? competition.status.period;
  const liveClock = latestPlay?.clock ?? competition.status.displayClock;
  const endOfGameByText = /end of.*game|final/i.test(latestPlayType || latestPlay?.text || '');
  const isFinal = compState === 'post' || endOfGameByText;
  const liveState = isFinal ? 'post' : (compState === 'pre' ? 'pre' : compState);
  const livePossession = latestPlay?.possession || competition.situation?.possession;

  return (
    <>
      <div className='mx-2'>
        {/* Icon Bar for Advanced Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setModalView('prediction')}
            className="bg-gradient-to-r from-neon-cyan/10 to-neon-cyan/5 hover:from-neon-cyan/20 hover:to-neon-cyan/10 border border-neon-cyan/30 rounded-lg px-3 py-2 flex items-center justify-center gap-2 text-neon-cyan font-bold text-xs transition-all"
          >
            <FaChartLine className="text-sm" />
            <span>Prediction</span>
          </button>
          <button
            onClick={() => setModalView('leaders')}
            className="bg-gradient-to-r from-neon-pink/10 to-neon-pink/5 hover:from-neon-pink/20 hover:to-neon-pink/10 border border-neon-pink/30 rounded-lg px-3 py-2 flex items-center justify-center gap-2 text-neon-pink font-bold text-xs transition-all"
          >
            <FaUsers className="text-sm" />
            <span>Leaders</span>
          </button>
          <button
            onClick={() => setModalView('stats')}
            className="bg-gradient-to-r from-neon-cyan/10 to-neon-pink/10 hover:from-neon-cyan/20 hover:to-neon-pink/20 border border-neon-cyan/30 rounded-lg px-3 py-2 flex items-center justify-center gap-2 text-white font-bold text-xs transition-all"
          >
            <FaChartBar className="text-sm" />
            <span>Stats</span>
          </button>
          <button
            onClick={() => setModalView('scoring')}
            className="bg-gradient-to-r from-neon-pink/10 to-neon-cyan/10 hover:from-neon-pink/20 hover:to-neon-cyan/20 border border-neon-pink/30 rounded-lg px-3 py-2 flex items-center justify-center gap-2 text-neon-pink font-bold text-xs transition-all"
          >
            <FaChartBar className="text-sm" />
            <span>Scoring</span>
          </button>
        </div>

        {/* Box Score */}
        <div>
          {/* Team Scores */}
          <div className="border border-neon-cyan/30 rounded-lg bg-bg-dark/30">
            <div className="flex items-start justify-between px-2 pt-2">
            {/* Away Team */}
            <button
          onClick={() => awayTeam?.id && router.push(`/nfl/team/${awayTeam.id}`)}
          className="flex flex-col items-center hover:bg-neon-cyan/10 active:bg-neon-cyan/20 rounded-lg py-2 transition-all group cursor-pointer flex-1 focus:outline-none"
            >
          <div className="w-16 h-16 mb-1 flex items-center justify-center">
            <img
              src={getTeamLogo(awayTeam?.team)}
              alt={awayTeam?.team?.displayName}
              className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform"
            />
          </div>
          <h2 className="text-text-light font-bold text-xs text-center px-1 group-hover:text-neon-cyan transition-colors leading-tight">
            {awayTeam?.team?.displayName}
          </h2>
          {awayTeam?.curRank && (
            <div className="text-neon-cyan text-[10px] font-bold">
              #{awayTeam.curRank}
            </div>
          )}
          <p className="text-text-muted text-[10px]">{awayTeam?.records?.[0]?.summary}</p>
            </button>

            {/* Center: Date, Time, and Score */}
            <div className="flex flex-col items-center justify-center px-4 flex-1">
              {/* Date */}
              <p className="text-text-muted text-[10px] font-semibold mb-1">
                {competition.date ? (
                  new Date(competition.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })
                ) : (
                  '-'
                )}
              </p>
              
              {/* Score */}
              <div className="flex items-center gap-3 my-1">
                <CountUpScore 
                  value={currentAwayScore}
                  className="text-neon-cyan text-4xl font-bold"
                />
                <span className="text-text-muted text-xl">-</span>
                <CountUpScore 
                  value={currentHomeScore}
                  className="text-neon-cyan text-4xl font-bold"
                />
              </div>
              
              {/* Status/Time */}
              <div className="flex items-center gap-2">
                {liveState === 'in' ? (
                  <>
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="text-red-500 font-bold text-[10px]">LIVE</span>
                    <span className="text-text-light font-bold text-[10px]">Q{livePeriod} - {liveClock}</span>
                  </>
                ) : liveState === 'post' ? (
                  <span className="text-text-muted font-bold text-[10px]">FINAL</span>
                ) : (
                  <span className="text-text-light font-bold text-[10px]">
                    {(() => {
                      const days = Math.floor(gameCountdown / (1000 * 60 * 60 * 24));
                      const hours = Math.floor((gameCountdown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                      const minutes = Math.floor((gameCountdown % (1000 * 60 * 60)) / (1000 * 60));
                      const seconds = Math.floor((gameCountdown % (1000 * 60)) / 1000);
                      
                      if (days > 0) return `${days}d ${hours}h ${minutes}m`;
                      if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
                      if (minutes > 0) return `${minutes}m ${seconds}s`;
                      return `${seconds}s`;
                    })()}
                  </span>
                )}
              </div>
            </div>

            {/* Home Team */}
            <button
          onClick={() => homeTeam?.id && router.push(`/nfl/team/${homeTeam.id}`)}
          className="flex flex-col items-center hover:bg-neon-cyan/10 active:bg-neon-cyan/20 rounded-lg py-2 transition-all group cursor-pointer flex-1 focus:outline-none"
            >
          <div className="w-16 h-16 mb-1 flex items-center justify-center">
            <img
              src={getTeamLogo(homeTeam?.team)}
              alt={homeTeam?.team?.displayName}
              className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform"
            />
          </div>
          <h2 className="text-text-light font-bold text-xs text-center px-1 group-hover:text-neon-cyan transition-colors leading-tight">
            {homeTeam?.team?.displayName}
          </h2>
          {homeTeam?.curRank && (
            <div className="text-neon-cyan text-[10px] font-bold">
              #{homeTeam.curRank}
            </div>
          )}
          <p className="text-text-muted text-[10px]">{homeTeam?.records?.[0]?.summary}</p>
            </button>
          </div>
        </div>


        </div>
      </div>


      
      {/* Live Game Situation */}
      {(competition.status.type.state === 'in') && (
        <div className="">
          {(() => {
            const situation = latestPlay
              ? {
                  lastPlay: latestPlay,
                  possession: latestPlay.possession,
                  downDistanceText: competition.situation?.downDistanceText,
                  awayTimeouts: competition.situation?.awayTimeouts,
                  homeTimeouts: competition.situation?.homeTimeouts,
                }
              : competition.situation
                ? {
                    ...competition.situation,
                    possession: competition.situation.possession,
                  }
                : undefined;

            if (!situation) return null;

            return (
              <div className="">
                <div className="pt-2 ">
                  <div className='mx-2'>
                    {/* Game Leaderboard removed - already shown below box score */}

                    {/* Timeouts, Possession, and Run Tracker - Status Bar */}
                    <div className="mb-3 bg-bg-dark/30 rounded-xl border border-neon-cyan/20 overflow-hidden">
                    
                      {/* Top Row - Possession and Current Run */}
                      <div className='flex p-2 border-b border-neon-cyan/10 items-center'>
                      {/* Left: Possession (NFL) or Possession (NBA) */}
                      <div className="flex flex-col gap-0.5 flex-1">
                        <span className="text-text-muted text-[9px] font-bold uppercase tracking-wider">Possession</span>
                        <div className="flex items-center gap-2">
                          {isNba ? (
                            livePossession && homeTeam?.id && awayTeam?.id && (
                              <>
                                <img
                                  src={livePossession === homeTeam?.id ? getTeamLogo(homeTeam?.team) : getTeamLogo(awayTeam?.team)}
                                  alt="Possession"
                                  className="w-5 h-5"
                                />
                                <span className="text-text-light font-semibold text-xs">
                                  {livePossession === homeTeam?.id ? homeTeam?.team.abbreviation : awayTeam?.team.abbreviation}
                                </span>
                              </>
                            )
                          ) : (
                            livePossession && homeTeam?.id && awayTeam?.id && (
                              <>
                                <img
                                  src={livePossession === homeTeam?.id ? getTeamLogo(homeTeam?.team) : getTeamLogo(awayTeam?.team)}
                                  alt="Possession"
                                  className="w-5 h-5"
                                />
                                <span className="text-neon-cyan font-semibold text-xs">
                                  {livePossession === homeTeam?.id ? homeTeam?.team.abbreviation : awayTeam?.team.abbreviation}
                                </span>
                              </>
                            )
                          )}
                        </div>
                      </div>

                      {/* Play Type - Center */}
                      <div className="flex-1 flex justify-center">
                        <div className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/50 rounded-full w-max-44 content-center flex items-center gap-2">
                        <span className="text-yellow-400 text-xs">
                          {latestPlayType || 'Play'}
                        </span>
                        </div>
                      </div>

                      {/* Right: Current Run (NBA only) */}
                      <div className="flex-1 flex flex-col items-end gap-0.5">
                        {isNba && nbaRun && runTeam ? (
                          <>
                            <span className="text-text-muted text-[9px] font-bold uppercase tracking-wider">Current Run</span>
                            <div className="flex items-center gap-2">
                              <img
                                src={getTeamLogo(runTeam.team)}
                                alt={runTeam.team?.displayName}
                                className="w-5 h-5"
                              />
                              <span className="text-neon-cyan font-bold text-xs">
                                {nbaRun.runPoints}-{nbaRun.oppPoints}
                              </span>
                              <span className="text-text-muted text-[10px]">
                                {nbaRun.durationLabel}
                              </span>
                            </div>
                          </>
                        ) : null}
                      </div>

                      </div>

                      {/* Court/Field Container with Timeouts */}
                      <div className="relative">
                        {/* Away Team Timeouts - Top Left */}
                        <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
                          <span className="text-text-muted text-xs font-semibold">{awayTeam?.team.abbreviation}</span>
                          <div className="flex gap-1">
                            {[1, 2, 3].map((_, idx) => (
                              <div
                                key={idx}
                                className={`w-2 h-2 rounded-full ${
                                  idx < (situation.awayTimeouts ?? 3)
                                  ? 'bg-neon-cyan shadow-[0_0_8px_rgba(0,255,231,0.6)]'
                                  : 'bg-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Home Team Timeouts - Top Right */}
                        <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                          <div className="flex gap-1">
                            {[1, 2, 3].map((_, idx) => (
                              <div
                                key={idx}
                                className={`w-2 h-2 rounded-full ${
                                  idx < (situation.homeTimeouts ?? 3)
                                  ? 'bg-neon-pink shadow-[0_0_8px_rgba(250,175,232,0.6)]'
                                  : 'bg-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-text-muted text-xs font-semibold">{homeTeam?.team.abbreviation}</span>
                        </div>

                        {isNba ? (
                          <BasketballCourt
                            homeTeam={homeTeam?.team || homeTeam}
                            awayTeam={awayTeam?.team || awayTeam}
                            lastPlay={situation.lastPlay}
                            playLog={playLog}
                            getTeamLogo={getTeamLogo}
                          />
                        ) : (
                          <FootballField
                            homeTeam={homeTeam}
                            awayTeam={awayTeam}
                            leftTeamOverride={(latestPlay?.quarter ?? competition.status?.period ?? 1) >= 3 ? homeTeam : awayTeam}
                            rightTeamOverride={(latestPlay?.quarter ?? competition.status?.period ?? 1) >= 3 ? awayTeam : homeTeam}
                            lastPlay={situation.lastPlay}
                            situation={situation}
                            playLog={playLog}
                            getTeamLogo={getTeamLogo}
                          />
                        )}
                      </div>
                    </div>


                    {/* Current Picks Display - Only show if user is logged in */}
                    {user && currentPicks.length > 0 && (
                      <div className="space-y-2">
                        <div className="w-full bg-neon-pink/20 border border-neon-pink/50 rounded-lg px-4 py-3 text-neon-pink font-bold text-sm">
                          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-neon-pink/30">
                            <span className="text-neon-pink text-xs font-bold">LINE UP</span>
                            <button
                              onClick={onOpenPicks}
                              className="btn-teal px-3 py-1 text-xs h-auto"
                            >
                              Pick!
                            </button>
                            <span className="text-text-muted text-[10px]">
                              Session: {Object.values(picksScores).reduce((sum, score) => sum + score, 0)} pts
                            </span>
                          </div>
                          <div className="flex flex-col w-full">
                            <div className="flex gap-1 flex-nowrap w-full overflow-hidden">
                              {currentPicks.map((player) => {
                              const headshotUrl = getHeadshotUrl({ id: player.id, headshot: player.headshot }, urlLeague);
                              return (
                                <div key={player.id} className="flex flex-col items-center flex-1 min-w-0">
                                  {headshotUrl ? (
                                    <img
                                      src={headshotUrl}
                                      alt={player.displayName}
                                      className="w-12 h-12 rounded-full object-cover border-2 border-neon-pink/50"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                                        const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
                                        if (fallback) fallback.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div 
                                    className="w-12 h-12 rounded-full bg-bg-darker border-2 border-neon-pink/50 flex items-center justify-center"
                                    style={{ display: headshotUrl ? 'none' : 'flex' }}
                                  >
                                    <span className="text-neon-pink text-xs font-bold">
                                      {player.shortName?.substring(0, 2).toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="text-white text-[10px] font-bold mt-1 text-center truncate w-full">
                                    {player.shortName}
                                  </span>
                                  <div className="relative">
                                    <span className="text-neon-pink text-lg font-bold">{picksScores[player.id] || 0}</span>
                                    {scoreIncreasePlayerIds.has(player.id) && (
                                      <img
                                        src="/assets/confetti.gif"
                                        alt="Score increase"
                                        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-6 h-6 animate-bounce"
                                        onError={(e) => {
                                          // Fallback if GIF not found
                                          const parent = e.currentTarget.parentElement;
                                          if (parent) {
                                            const emoji = document.createElement('div');
                                            emoji.textContent = '✨';
                                            emoji.className = 'absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-lg animate-bounce';
                                            parent.appendChild(emoji);
                                            e.currentTarget.style.display = 'none';
                                          }
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        </div>
                      </div>
                    )}

                    {/* No Picks Prompt - Show if user is logged in but has no picks */}
                    {user && currentPicks.length === 0 && (
                      <div className="space-y-2">
                        <div className="w-full bg-gradient-to-r from-neon-cyan/10 via-bg-darkest to-neon-pink/10 border border-neon-cyan/30 rounded-lg px-4 py-4 shadow-[0_0_16px_rgba(0,255,231,0.15)]">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="text-white font-bold text-base mb-1">Make Your Picks</div>
                              <div className="text-text-muted text-xs">
                                Select 5 players and earn points based on their in-game actions
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setActiveContentView('picks');
                                setTimeout(() => {
                                  playerPickRef.current?.openRoster();
                                }, 100);
                              }}
                              className="btn-pink px-4 py-2 text-sm font-bold whitespace-nowrap"
                            >
                              Choose Picks
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Content View Buttons */}
                    <div className="mt-4 mx-2 grid grid-cols-3 gap-2 mb-4">
                      <button
                        onClick={() => setActiveContentView('picks')}
                        className={`rounded-lg px-3 py-2 flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                          activeContentView === 'picks'
                            ? 'bg-gradient-to-r from-purple-500/30 to-purple-400/20 border-2 border-purple-400 text-purple-300 shadow-lg shadow-purple-500/20'
                            : 'bg-gradient-to-r from-purple-500/10 to-purple-400/5 hover:from-purple-500/20 hover:to-purple-400/10 border border-purple-400/30 text-purple-400'
                        }`}
                      >
                        <FaClipboardList className="text-sm" />
                        <span>Picks</span>
                      </button>
                      <button
                        onClick={() => setActiveContentView('timeline')}
                        className={`rounded-lg px-3 py-2 flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                          activeContentView === 'timeline'
                            ? 'bg-gradient-to-r from-amber-500/30 to-amber-400/20 border-2 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/20'
                            : 'bg-gradient-to-r from-amber-500/10 to-amber-400/5 hover:from-amber-500/20 hover:to-amber-400/10 border border-amber-400/30 text-amber-400'
                        }`}
                      >
                        <FaClock className="text-sm" />
                        <span>Timeline</span>
                      </button>
                      <button
                        onClick={() => setActiveContentView('playlog')}
                        className={`rounded-lg px-3 py-2 flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                          activeContentView === 'playlog'
                            ? 'bg-gradient-to-r from-green-500/30 to-green-400/20 border-2 border-green-400 text-green-300 shadow-lg shadow-green-500/20'
                            : 'bg-gradient-to-r from-green-500/10 to-green-400/5 hover:from-green-500/20 hover:to-green-400/10 border border-green-400/30 text-green-400'
                        }`}
                      >
                        <FaListAlt className="text-sm" />
                        <span>Play Log</span>
                      </button>
                    </div>

                    {/* Picks Section */}
                    {activeContentView === 'picks' && (
                      <div className="mt-2 mx-2">
                        {resolvedHomeTeamId && resolvedAwayTeamId && gameId ? (
                          <ChoosePicks
                            gameId={gameId}
                            homeTeamId={resolvedHomeTeamId}
                            awayTeamId={resolvedAwayTeamId}
                            homeTeamInfo={{
                              name: homeTeam?.team?.displayName || '',
                              logo: getTeamLogo(homeTeam?.team) || '',
                              color: homeTeam?.team?.color || '00ffe7'
                            }}
                            awayTeamInfo={{
                              name: awayTeam?.team?.displayName || '',
                              logo: getTeamLogo(awayTeam?.team) || '',
                              color: awayTeam?.team?.color || 'faafe8'
                            }}
                            gameStatus={competition?.status?.type?.state || 'pre'}
                            gameStartDate={competition?.date || ''}
                            isExpanded={true}
                            onToggle={() => {}}
                            playLog={playLog}
                            situation={competition?.situation}
                            homeTeam={homeTeam}
                            awayTeam={awayTeam}
                            getTeamLogo={getTeamLogo}
                          />
                        ) : (
                          <div className="bg-purple-500/5 border border-purple-400/20 rounded-lg p-6 text-center">
                            <p className="text-text-muted">Loading picks...</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timeline Section - Scoring by Time */}
                    {activeContentView === 'timeline' && scoringPlays.length > 0 && (
                      <div className="mt-2 mx-2">
                        <PointsChart
                          gameId={gameId || ''}
                          homeTeamInfo={{
                            name: homeTeam?.team?.displayName || '',
                            logo: getTeamLogo(homeTeam?.team) || '',
                            color: homeTeam?.team?.color || '00ffe7'
                          }}
                          awayTeamInfo={{
                            name: awayTeam?.team?.displayName || '',
                            logo: getTeamLogo(awayTeam?.team) || '',
                            color: awayTeam?.team?.color || 'faafe8'
                          }}
                          scoringPlays={scoringPlays}
                          gameStatus={competition?.status?.type?.state || 'pre'}
                        />
                      </div>
                    )}

                    {/* Play Log Section */}
                    {activeContentView === 'playlog' && playLog.length > 0 && (
                      <div className="mt-2">
                        <PlayLog
                          playLog={playLog}
                          homeTeam={homeTeam}
                          awayTeam={awayTeam}
                          getTeamLogo={getTeamLogo}
                          title="Play Log"
                          showTitle={true}
                          countdown={countdown}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Pre-game or Post-game Info */}
      {competition.status.type.state !== 'in' && (
        <div className="text-center">
            {/* Line Scores */}
            {(homeTeam?.linescores || awayTeam?.linescores) && (
              <div className="p-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neon-cyan/20">
                        <th className="text-left text-text-muted font-semibold py-2">Team</th>
                        {[1, 2, 3, 4].map(q => (
                          <th key={q} className="text-center text-text-muted font-semibold py-2">Q{q}</th>
                        ))}
                        {(homeTeam?.linescores?.length ?? 0) > 4 && (
                          <th className="text-center text-text-muted font-semibold py-2">OT</th>
                        )}
                        <th className="text-center text-text-muted font-semibold py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-neon-cyan/10">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <img src={getTeamLogo(awayTeam?.team)} alt={awayTeam?.team.abbreviation} className="w-7 h-6" />
                            <span className="text-text-light font-bold">{awayTeam?.team.abbreviation}</span>
                          </div>
                        </td>
                        {awayTeam?.linescores?.map((score: any, idx: number) => (
                          <td key={idx} className="text-center text-text-light py-3">
                            <CountUpScore value={parseInt(score.displayValue) || 0} duration={800} />
                          </td>
                        ))}
                        <td className="text-center text-neon-cyan font-bold py-3">
                          <CountUpScore value={currentAwayScore} />
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <img src={getTeamLogo(homeTeam?.team)} alt={homeTeam?.team.abbreviation} className="w-7 h-6" />
                            <span className="text-text-light font-bold">{homeTeam?.team.abbreviation}</span>
                          </div>
                        </td>
                        {homeTeam?.linescores?.map((score: any, idx: number) => (
                          <td key={idx} className="text-center text-text-light py-3">
                            <CountUpScore value={parseInt(score.displayValue) || 0} duration={800} />
                          </td>
                        ))}
                        <td className="text-center text-neon-pink font-bold py-3">
                          <CountUpScore value={currentHomeScore} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      )}

    </>
  );
};

export default Info;