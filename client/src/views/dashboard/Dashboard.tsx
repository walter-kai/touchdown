'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { FaFootballBall, FaTrophy, FaChartBar, FaGamepad, FaChevronDown, FaChevronUp, FaUser, FaMedal, FaClipboardCheck } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { jwtStorage } from '../../utils/jwtStorage';
import LoadingFootball from '../../components/loading/LoadingFootball';
import { CountUpScore } from '../../components/common/CountUpScore';
import { useAuth } from '../../providers/AuthContext';
import { useLeague } from '../../providers/LeagueContext';
import TelegramCard from './TelegramCard';
import { debugLog } from '@/utils/debugLog';
import { getTeamLogoUrl, getHeadshotUrl as getHeadshotUrlUtil } from '@/utils/espnImages';
import { calculateAthleteScoresFromPlays, fetchPlaysByPlayFromESPN } from '@/utils/scoreCalculation';
import { LeaderboardEntry } from '../../../../types/espn/leaderboard';

interface Player {
  id: string;
  displayName: string;
  position: string;
  headshot?: string;
  jersey?: string;
}

interface Pick {
  players: Player[];
  totalScore: number;
  timestamp: string;
}

interface GamePick {
  gameId: string;
  picks: Pick[];
  lastUpdated: string | null;
  totalPicks: number;
  teamData?: {
    league: 'nba' | 'nfl';
    homeTeam: {
      name: string;
      abbreviation: string;
    };
    awayTeam: {
      name: string;
      abbreviation: string;
    };
  };
  teamLogos?: {  // Legacy support
    awayLogo: string;
    homeLogo: string;
  };
}

interface GameScores {
  gameScores: Record<string, number>;
  sessionScores: Record<string, number>;
  userScores: Record<string, number>;
  totalScore: number;
}

interface GameData {
  gameId: string;
  gameName?: string;
  homeTeam?: any;
  awayTeam?: any;
  picks: Pick[];
  scores?: GameScores;
  totalUserScore: number;
  status?: 'pre' | 'in' | 'post';
  league?: 'nfl' | 'nba';
  rank?: number | null;
  totalUsersInGame?: number | null;
}

const Dashboard: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  // Derive league from URL instead of context
  const league = window.location.pathname.startsWith('/nba') ? 'nba' : 'nfl';
  const [loading, setLoading] = useState(true);
  const [gamesWithPicks, setGamesWithPicks] = useState<GameData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const fetchedUserRef = useRef<string | null>(null); // Track which user was fetched

  const profilePicture = user?.photoUrl || user?.googlePicture || user?.providerData?.googlePicture;
  // Helper function to render text with emojis properly
  const renderTextWithEmojis = (text: string) => {
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = emojiRegex.exec(text)) !== null) {
      // Add text before emoji
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.slice(lastIndex, match.index)}
          </span>
        );
      }
      // Add emoji with explicit color to override h1 transparency
      parts.push(
        <span key={`emoji-${match.index}`} style={{ color: '#fff', backgroundClip: 'unset', WebkitBackgroundClip: 'unset', textShadow: 'none' }}>
          {match[0]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.slice(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : text;
  };

  const getOrdinalParts = (rank: number) => {
    const mod100 = rank % 100;
    let suffix = 'th';

    if (mod100 < 11 || mod100 > 13) {
      switch (rank % 10) {
        case 1:
          suffix = 'st';
          break;
        case 2:
          suffix = 'nd';
          break;
        case 3:
          suffix = 'rd';
          break;
        default:
          suffix = 'th';
      }
    }

    return { number: rank, suffix };
  };
  useEffect(() => {
    // Reset avatar error when the source changes
    setAvatarError(false);
  }, [profilePicture]);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLeaderboardLoading(true);
        const response = await axios.get('/api/leaderboard');
        if (response.data.success) {
          setLeaderboard(response.data.leaderboard);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Fetch all user picks and related game data
  useEffect(() => {
    // Reset when no user
    if (!user || !user.email) {
      fetchedUserRef.current = null;
      setLoading(false);
      setGamesWithPicks([]);
      return;
    }

    // Prevent double-fetching for the same user
    if (fetchedUserRef.current === user.email) return;
    
    const fetchDashboardData = async () => {
      // Clear cache first to ensure fresh data
      const cacheKey = 'dashboard_processed_cache';
      localStorage.removeItem(cacheKey);

      try {
        setLoading(true);
        const token = jwtStorage.getToken();

        if (!token) {
          setError('Please log in to view your dashboard');
          setLoading(false);
          return;
        }

        // Check localStorage cache first (for processed data)
        const cacheKey = 'dashboard_processed_cache';
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
          try {
            const { data, timestamp } = JSON.parse(cachedData);
            const cacheAge = Date.now() - timestamp;
            const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes
            
            // Use cached data if less than 3 minutes old
            if (cacheAge < CACHE_DURATION && Array.isArray(data)) {
              debugLog(`✅ Using cached dashboard data (${Math.round(cacheAge / 1000)}s old)`);
              setGamesWithPicks(data);
              setLoading(false);
              return;
            } else {
              debugLog('Cache expired, fetching fresh data...');
              localStorage.removeItem(cacheKey);
            }
          } catch (error) {
            console.error('Error parsing cached dashboard data:', error);
            localStorage.removeItem(cacheKey);
          }
        }

        debugLog('🔄 Fetching fresh dashboard data from API...');

        // Fetch all user picks from optimized dashboard endpoint (NO ESPN API calls!)
        const picksResponse = await axios.get('/api/picks/user/all-for-dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });

        interface GamePickWithScores extends GamePick {
          scores: GameScores;
        }

        const userGames: GamePickWithScores[] = picksResponse.data.games || [];
        debugLog('📊 User games with picks and scores:', userGames);

        if (userGames.length === 0) {
          setGamesWithPicks([]);
          setLoading(false);
          return;
        }

        // Helper: infer league from stored data to call the right ESPN summary
        const inferLeague = (gamePick: GamePick): 'nfl' | 'nba' => {
          // 1) Explicit teamData league
          if (gamePick.teamData?.league === 'nba' || gamePick.teamData?.league === 'nfl') {
            return gamePick.teamData.league;
          }

          // 2) Check logos for hints
          const logoStrings: string[] = [];
          if (gamePick.teamLogos) {
            logoStrings.push(gamePick.teamLogos.awayLogo, gamePick.teamLogos.homeLogo);
          }
          gamePick.picks?.forEach(p => {
            p.players.forEach(pl => {
              const l = (pl as any)?.team?.logo || (pl as any)?.logo || '';
              if (l) logoStrings.push(l);
            });
          });
          const hasNBA = logoStrings.some(l => typeof l === 'string' && l.toLowerCase().includes('/nba/'));
          const hasNFL = logoStrings.some(l => typeof l === 'string' && l.toLowerCase().includes('/nfl/'));
          if (hasNBA && !hasNFL) return 'nba';
          if (hasNFL && !hasNBA) return 'nfl';

          // 3) Fallback to current UI league
          return league;
        };

        // Process all games - extract team info and then enhance scores from ESPN plays on the client
        const gamePromises = userGames.map(async (gamePick) => {
          try {
            const totalUserScore = gamePick.scores?.totalScore || 0;

            let gameName = '';
            let gameStatus: 'pre' | 'in' | 'post' = 'post';
            let homeTeam: any = null;
            let awayTeam: any = null;

            // Priority 1: Check if teamData is stored (includes names & abbreviations)
            if (gamePick.teamData) {
              homeTeam = { 
                team: { 
                  displayName: gamePick.teamData.homeTeam.name,
                  abbreviation: gamePick.teamData.homeTeam.abbreviation,
                  logo: (gamePick.teamData.homeTeam as any).logo || getTeamLogoUrl(gamePick.teamData.homeTeam.abbreviation, gamePick.teamData.league)
                } 
              };
              awayTeam = { 
                team: { 
                  displayName: gamePick.teamData.awayTeam.name,
                  abbreviation: gamePick.teamData.awayTeam.abbreviation,
                  logo: (gamePick.teamData.awayTeam as any).logo || getTeamLogoUrl(gamePick.teamData.awayTeam.abbreviation, gamePick.teamData.league)
                } 
              };
              gameName = `${gamePick.teamData.awayTeam.abbreviation} @ ${gamePick.teamData.homeTeam.abbreviation}`;
              debugLog(`✅ Using stored teamData for game ${gamePick.gameId}`);
            } 
            // Priority 2: Extract team info from players in picks (team logos already embedded!)
            else if (gamePick.picks?.length > 0) {
              const latestPick = gamePick.picks[gamePick.picks.length - 1];
              const players = latestPick?.players || [];
              
              // Collect unique teams from all players
              const teamsMap = new Map<string, any>();
              players.forEach((player: any) => {
                if (player.team?.id && player.team?.logo) {
                  teamsMap.set(player.team.id, player.team);
                }
              });
              
              const teams = Array.from(teamsMap.values());
              
              if (teams.length >= 2) {
                // Assume first unique team is away, second is home
                awayTeam = { team: { ...teams[0], displayName: teams[0].name || 'Away' } };
                homeTeam = { team: { ...teams[1], displayName: teams[1].name || 'Home' } };
                gameName = `${teams[0].abbreviation || 'AWAY'} @ ${teams[1].abbreviation || 'HOME'}`;
                debugLog(`✅ Extracted team info from picks for game ${gamePick.gameId}`);
              } else if (teams.length === 1) {
                // Only one team found, use it for both (shouldn't happen but handle it)
                const team = teams[0];
                awayTeam = { team: { ...team, displayName: team.name || 'Away' } };
                homeTeam = { team: { ...team, displayName: team.name || 'Home' } };
                gameName = `${team.abbreviation || 'TEAM'} Game`;
                debugLog(`⚠️ Only one team found in picks for game ${gamePick.gameId}`);
              }
            }
            
            // Fallback: Use legacy teamLogos if available
            if (!gameName && gamePick.teamLogos) {
              awayTeam = { team: { logo: gamePick.teamLogos.awayLogo, displayName: 'Away' } };
              homeTeam = { team: { logo: gamePick.teamLogos.homeLogo, displayName: 'Home' } };
              gameName = `Game ${gamePick.gameId}`;
              debugLog(`⚠️ Using legacy teamLogos for game ${gamePick.gameId}`);
            }
            
            // Final fallback
            if (!gameName) {
              gameName = `Game ${gamePick.gameId}`;
              debugLog(`⚠️ No team data available for game ${gamePick.gameId}`);
            }

            // Kick off background fetch to get plays and calculate per-athlete scores on the client
            const fetchAndCalculateScores = async () => {
              try {
                const gameLeague = inferLeague(gamePick);
                const plays = await fetchPlaysByPlayFromESPN(gamePick.gameId, gameLeague);
                const calculatedScores = calculateAthleteScoresFromPlays(gamePick.picks, plays, gamePick.gameId);

                setGamesWithPicks(prev =>
                  prev.map(g =>
                    g.gameId === gamePick.gameId
                      ? { ...g, scores: calculatedScores, totalUserScore: calculatedScores.totalScore }
                      : g
                  )
                );
                debugLog(`✅ Calculated per-athlete scores for game ${gamePick.gameId}`);
              } catch (err) {
                console.error(`Error calculating scores for game ${gamePick.gameId}:`, err);
              }
            };

            fetchAndCalculateScores().catch(console.error);

            return {
              gameId: gamePick.gameId,
              gameName,
              homeTeam,
              awayTeam,
              picks: gamePick.picks,
              scores: gamePick.scores,
              totalUserScore,
              status: gameStatus,
              league: inferLeague(gamePick) // Store the resolved league for navigation
            };
          } catch (err) {
            console.error(`Error fetching data for game ${gamePick.gameId}:`, err);
            return null;
          }
        });

        // Wait for all games to be processed
        const results = await Promise.all(gamePromises);
        
        // Filter out any null results (failed requests)
        const validGames = results.filter((game): game is NonNullable<typeof game> => game !== null);

        // Sort by total score descending
        validGames.sort((a, b) => b.totalUserScore - a.totalUserScore);

        // Fetch per-game rank without scanning the whole collection
        const gamesWithRank = await Promise.all(validGames.map(async (game) => {
          if (!game.league) return game;

          const gameDataCacheKey = `gameData_${game.league}_${game.gameId}`;
          
          // Check localStorage cache first
          const cachedGameData = localStorage.getItem(gameDataCacheKey);
          if (cachedGameData) {
            try {
              const { data, timestamp } = JSON.parse(cachedGameData);
              const cacheAge = Date.now() - timestamp;
              const CACHE_DURATION = 1 * 60 * 1000; // 1 minute
              
              // Use cached data if less than 1 minute old
              if (cacheAge < CACHE_DURATION) {
                debugLog(`✅ Using cached gameData for ${game.gameId} (${Math.round(cacheAge / 1000)}s old)`);
                const entries = data?.leaderboard?.entries || [];
                const totalUsersInGame = data?.leaderboard?.totalUsers || (Array.isArray(entries) ? entries.length : null);
                const userEntry = Array.isArray(entries)
                  ? entries.find((entry: any) => entry.userId === user?.email || entry.userId === user?.uid)
                  : null;

                return {
                  ...game,
                  rank: userEntry?.rank ?? null,
                  totalUsersInGame: totalUsersInGame ?? null,
                };
              } else {
                debugLog(`Cache expired for gameData ${game.gameId}, fetching fresh data...`);
                localStorage.removeItem(gameDataCacheKey);
              }
            } catch (error) {
              console.error(`Error parsing cached gameData for ${game.gameId}:`, error);
              localStorage.removeItem(gameDataCacheKey);
            }
          }

          try {
            const rankRes = await axios.get(`/api/game-data/${game.league}/${game.gameId}`);
            const entries = rankRes.data?.leaderboard?.entries || [];
            const totalUsersInGame = rankRes.data?.leaderboard?.totalUsers || (Array.isArray(entries) ? entries.length : null);
            const userEntry = Array.isArray(entries)
              ? entries.find((entry: any) => entry.userId === user?.email || entry.userId === user?.uid)
              : null;

            // Cache the gameData with timestamp
            localStorage.setItem(gameDataCacheKey, JSON.stringify({
              data: rankRes.data,
              timestamp: Date.now()
            }));

            return {
              ...game,
              rank: userEntry?.rank ?? null,
              totalUsersInGame: totalUsersInGame ?? null,
            };
          } catch (rankErr: any) {
            // 404 is expected for games with no picks yet - don't log as error
            if (rankErr?.response?.status !== 404) {
              console.error(`Error fetching rank for game ${game.gameId}:`, rankErr);
            }
            return game;
          }
        }));
        
        // Cache the processed results
        localStorage.setItem(cacheKey, JSON.stringify({
          data: gamesWithRank,
          timestamp: Date.now()
        }));
        
        setGamesWithPicks(gamesWithRank);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard');
        setLoading(false);
      }
    };

    fetchedUserRef.current = user.email; // Mark this user as fetched
    fetchDashboardData();
  }, [user]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const totalGames = gamesWithPicks.length;
    const totalScore = gamesWithPicks.reduce((sum, game) => sum + game.totalUserScore, 0);
    const totalPlayers = new Set(
      gamesWithPicks.flatMap(game => 
        game.picks.flatMap(pick => 
          pick.players.map(p => p.id)
        )
      )
    ).size;

    return { totalGames, totalScore, totalPlayers };
  }, [gamesWithPicks]);

  // Toggle game expansion - only one at a time
  const toggleGameExpansion = (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGameId(prev => (prev === gameId ? null : gameId));
  };

  if (loading) {
    return <LoadingFootball message="Loading your dashboard..." />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 text-center">
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-2">
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-2 mb-2 px-2">
        <div className="bg-bg-dark/30 border border-neon-cyan/20 rounded-lg px-6 py-2 text-center relative overflow-hidden flex flex-col">
          <FaGamepad className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl text-neon-cyan/10" />
          <h3 className="mb-2 relative z-10">Games Played</h3>
          <div className="flex-1 flex items-end justify-center pb-2">
        <CountUpScore value={overallStats.totalGames} className="text-4xl font-bold text-neon-pink relative z-10" />
          </div>
        </div>

        <div className="bg-bg-dark/30 border border-neon-pink/20 rounded-lg  px-6 py-2 text-center relative overflow-hidden flex flex-col ">
          <FaTrophy className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl text-neon-pink/10" />
          <h3 className="mb-2 relative z-10">Total<br />Score</h3>
          <div className="flex-1 flex items-end justify-center pb-2">
        <CountUpScore value={overallStats.totalScore} className="text-4xl font-bold text-neon-pink relative z-10" />
          </div>
        </div>

        <div className="bg-bg-dark/30 border border-neon-cyan/20 rounded-lg px-6 py-2 text-center relative overflow-hidden flex flex-col">
          <FaChartBar className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl text-neon-cyan/10" />
          <h3 className="mb-2 relative z-10">Unique Players</h3>
          <div className="flex-1 flex items-end justify-center pb-2">
        <CountUpScore value={overallStats.totalPlayers} className="text-4xl font-bold text-neon-pink relative z-10" />
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      {!leaderboardLoading && leaderboard.length > 0 && (
        <div className="mb-2 bg-bg-dark/30 border border-neon-cyan/20 rounded-lg p-4 max-w-md mx-2">
          <h3 className="flex items-center gap-2 mb-3 text-neon-cyan">
            <FaMedal className="text-neon-pink" />
            Top 10 Leaderboard
          </h3>
          <div className="space-y-1.5">
            {leaderboard.map((entry) => {
              const isCurrentUser = entry.userId === user?.uid;
              const displayName = entry.displayName || 'Player';
              
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 p-2 rounded transition-all ${
                    isCurrentUser ? 'bg-neon-cyan/10 border border-neon-cyan/30' : 'bg-bg-darker/30'
                  }`}
                >
                  <div className={`text-sm font-bold w-6 text-center ${
                    entry.rank === 1 ? 'text-yellow-400' :
                    entry.rank === 2 ? 'text-gray-300' :
                    entry.rank === 3 ? 'text-orange-400' :
                    'text-gray-500'
                  }`}>
                    {entry.rank}
                  </div>
                  {entry.photoUrl ? (
                    <img
                      src={entry.photoUrl}
                      alt={displayName}
                      className="w-8 h-8 rounded-full border border-neon-cyan/30"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full border border-neon-cyan/30 bg-bg-dark flex items-center justify-center">
                      <FaUser className="text-neon-cyan text-xs" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-white">
                      {renderTextWithEmojis(displayName)}
                      {isCurrentUser && <span className="text-neon-cyan ml-1">(You)</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaTrophy className="text-neon-pink text-xs" />
                    <span className="text-sm font-bold text-neon-pink">
                      {entry.totalScore.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Games List */}
      <div className="space-y-4 mb-16 ">
        <h1 className="mx-2">Game History</h1>

        {gamesWithPicks.length === 0 ? (
          <div className="text-center py-6 bg-bg-dark/30 border border-neon-cyan/20 rounded-lg px-6 mx-2">
            <FaFootballBall className="text-6xl text-neon-pink mx-auto my-4 animate-bounce" />
            <h2 className="text-2xl font-bold mb-2">No Picks Yet</h2>
            <p className="text-gray-400 mb-6">Start making picks to see your dashboard!</p>
            <button
              onClick={() => router.push('/games')}
              className="btn-purple"
            >
              <FaGamepad className="inline mr-2" />
              Browse Games
            </button>
          </div>
        ) : (() => {
          // Group games by date in descending order
          const gamesByDate: Record<string, (typeof gamesWithPicks)> = {};
          
          gamesWithPicks.forEach(game => {
            // Get the date from the picks
            const pickDate = game.picks[0]?.timestamp ? new Date(game.picks[0].timestamp) : new Date();
            const dateKey = pickDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            });
            
            if (!gamesByDate[dateKey]) {
              gamesByDate[dateKey] = [];
            }
            gamesByDate[dateKey].push(game);
          });
          
          // Sort dates descending
          const sortedDates = Object.keys(gamesByDate).sort((a, b) => {
            const dateA = new Date(a).getTime();
            const dateB = new Date(b).getTime();
            return dateB - dateA;
          });
          
          return (
            <>
              {sortedDates.map((dateKey) => (
                <div key={dateKey}>
                  <h2 className="text-lg font-semibold text-neon-cyan mx-2 text-left">{dateKey}</h2>
                  <div className="">
                    {gamesByDate[dateKey].map((game) => {
                      const isExpanded = expandedGameId === game.gameId;
                      
                      return (
          <div
            key={game.gameId}
            className="relative overflow-hidden hover:border-neon-cyan/50 transition-all border border-white/10"
            style={{ 
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)'
            }}
          >
            {/* Game Header - Redesigned */}
            <div className="w-full px-3 py-2 relative bg-gradient-to-r from-white/[0.02] to-white/[0.01]">
              <div className="flex items-center justify-between gap-4">
                {/* Left Group: League Logo + Team Button */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* League Logo */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <img
                      src={game.league === 'nfl' ? '/logos/logo-nfl.svg' : '/logos/logo-nba.svg'}
                      alt={game.league?.toUpperCase()}
                      className="w-5 h-7"
                    />
                  </div>
                  
                  {/* Team Logos Pill Button */}
                  {game.awayTeam && game.homeTeam && (
                    <button
                      onClick={() => router.push(`/${game.league || 'nfl'}/game/${game.gameId}`)}
                      className="btn-standard flex items-center gap-1.5 px-2 py-1.5 flex-shrink-0 min-w-0"
                    >
                      <img 
                        src={game.awayTeam.team.logo} 
                        alt={game.awayTeam.team.abbreviation}
                        className="w-8 h-8 flex-shrink-0"
                      />
                      <span className="text-xs font-bold text-gray-400 flex-shrink-0">@</span>
                      <img 
                        src={game.homeTeam.team.logo} 
                        alt={game.homeTeam.team.abbreviation}
                        className="w-8 h-8 flex-shrink-0"
                      />
                    </button>
                  )}
                </div>
                
                {/* Center: Rank + Score in a centered div */}
                <div className="flex items-center justify-center gap-4 flex-1">
                  {/* Rank */}
                  {typeof game.rank === 'number' && game.totalUsersInGame && (
                    <div className="flex flex-col items-end w-full">
                      <span className="text-xl font-bold text-neon-pink leading-tight">
                        {(() => {
                          const { number, suffix } = getOrdinalParts(game.rank ?? 0);
                          return (
                            <>
                              {number}
                              <sup className="text-[10px] align-super ml-0.5">{suffix}</sup>
                            </>
                          );
                        })()}
                      </span>
                      <span className="text-[8px] text-gray-400">of {game.totalUsersInGame}</span>
                    </div>
                  )}
                  {/* Score */}
                  <div
                    className={`flex flex-col w-full ${
                      typeof game.rank === 'number' && game.totalUsersInGame
                        ? 'items-start'
                        : 'items-center'
                    }`}
                  >
                    <CountUpScore 
                      value={game.totalUserScore} 
                      className="text-xl font-bold text-neon-pink leading-tight"
                    />
                    <span className="text-[8px] text-gray-400">pts</span>
                  </div>
                </div>
                
                {/* Right: Show Picks Button */}
                <button
                  onClick={(e) => {
                  e.stopPropagation();
                  toggleGameExpansion(game.gameId, e);
                  }}
                  className="btn-purple rounded flex items-center h-12 gap-2 px-4 py-1.5 text-sm flex-shrink-0 whitespace-nowrap relative overflow-hidden group"
                  style={{
                    background: isExpanded 
                      ? 'linear-gradient(135deg, rgba(var(--neon-pink-rgb), 0.25), rgba(var(--purple-light-rgb), 0.25), rgba(var(--purple-dark-rgb), 0.3))' 
                      : 'linear-gradient(135deg, rgba(var(--purple-light-rgb), 0.15), rgba(var(--neon-pink-rgb), 0.15), rgba(var(--purple-dark-rgb), 0.2))',
                    boxShadow: isExpanded 
                      ? '0 0 25px rgba(var(--neon-pink-rgb), 0.5), inset 0 0 20px rgba(var(--purple-light-rgb), 0.2)' 
                      : '0 0 15px rgba(var(--purple-base-rgb), 0.3), inset 0 0 15px rgba(var(--neon-pink-rgb), 0.1)',
                    border: '2px solid',
                    borderImage: isExpanded 
                      ? 'linear-gradient(135deg, rgba(var(--neon-pink-rgb), 0.9), rgba(var(--purple-light-rgb), 0.9)) 1' 
                      : 'linear-gradient(135deg, rgba(var(--purple-light-rgb), 0.6), rgba(var(--neon-pink-rgb), 0.6)) 1',
                    transform: isExpanded ? 'scale(0.95)' : 'scale(1)',
                    transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <span className="font-bold relative z-10 bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">Show picks</span>
                </button>
              </div>
            </div>

            {/* Expanded Players Section */}
            {isExpanded && (
              <div className="border-t border-neon-cyan/20 bg-gradient-to-b from-white/[0.02] to-white/[0.005]">
                <div className="p-4">
                  {/* Stats Header */}
                  <div className="flex items-center gap-0 mb-4">
                    <div className="flex-1 group relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative px-5 py-4">
                        <div className="flex items-end justify-between">
                          <div className="flex items-baseline gap-3 ">
                            <span className="text-5xl font-black text-orange-base">{game.picks.length}</span>
                            <sup className="text-xs uppercase font-bold text-orange-warning tracking-wider">Picks</sup>
                          </div>
                          <FaClipboardCheck className="text-orange-base text-3xl opacity-90" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 group relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative px-5 py-4">
                        <div className="flex items-end justify-between">
                          <div className="flex items-baseline gap-3">
                            <span className="text-5xl font-black text-blue-500">{Array.from(new Set(game.picks.flatMap(pick => pick.players.map(p => p.id)))).length}</span>
                            <sup className="text-xs uppercase font-bold text-blue-400 tracking-wider b-12">Players</sup>
                          </div>
                          <FaUser className="text-blue-500 text-3xl opacity-90" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-400 uppercase tracking-wide">
                    <FaChartBar className="text-neon-cyan" />
                    Your Players
                  </h4>
                  
                  {game.scores && (
                    <div className="space-y-2">
                      {/* Get unique players with scores */}
                      {Array.from(
                        new Set(
                          game.picks.flatMap(pick => 
                            pick.players.map(p => p.id)
                          )
                        )
                      ).map(playerId => {
                        const player = game.picks
                          .flatMap(pick => pick.players)
                          .find(p => p.id === playerId);
                        
                        if (!player) return null;

                        const userScore = game.scores?.userScores[playerId] || 0;
                        const gameScore = game.scores?.gameScores[playerId] || 0;

                        return (
                          <div
                            key={playerId}
                            className="flex items-center justify-between p-3 bg-bg-dark/50 rounded-lg border border-neon-cyan/10 hover:border-neon-cyan/30 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              {(() => {
                                const league = (game as any).league || (game as any).teamData?.league || 'nfl';
                                const headshotUrl = getHeadshotUrlUtil({ id: player.id, headshot: player.headshot }, league as 'nfl' | 'nba');
                                return headshotUrl ? (
                                  <img
                                  src={headshotUrl}
                                  alt={player.displayName}
                                  className="w-12 h-12 rounded-full bg-neon-cyan/10 object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                  />
                                ) : null;
                              })()}
                              <div>
                                <p className="font-semibold text-white">{player.displayName}</p>
                                <p className="text-sm text-gray-400">{player.position}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <CountUpScore 
                                  value={userScore} 
                                  className="text-2xl font-bold text-neon-cyan"
                                />
                                <span className="text-sm text-gray-400">
                                  / <CountUpScore value={gameScore} duration={800} />
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">Your Score / Total</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Edit Picks Button */}
                  <button
                    onClick={() => router.push(`/${game.league || 'nfl'}/game/${game.gameId}`)}
                    className="btn-special mt-4 w-full"
                  >
                    Edit Picks
                  </button>
                </div>
              </div>
            )}
          </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default Dashboard;
