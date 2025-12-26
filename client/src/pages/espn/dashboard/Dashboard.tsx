import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaFootballBall, FaTrophy, FaChartBar, FaGamepad, FaChevronDown, FaChevronUp, FaUser, FaMedal } from 'react-icons/fa';
import { jwtStorage } from '../../../utils/jwtStorage';
import LoadingFootball from '../../../components/common/LoadingFootball';
import { CountUpScore } from '../../../components/common/CountUpScore';
import { useAuth } from '../../../providers/AuthContext';
import { useLeague } from '../../../providers/LeagueContext';
import TelegramCard from './TelegramCard';
import { debugLog } from '@/utils/debugLog';
import { getSummaryUrl } from '@/utils/espnApi';
import { getTeamLogoUrl, getHeadshotUrl as getHeadshotUrlUtil } from '@/utils/espnImages';
import { LeaderboardEntry } from '../../../../../types/espn/leaderboard';

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
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { league } = useLeague();
  const [loading, setLoading] = useState(true);
  const [gamesWithPicks, setGamesWithPicks] = useState<GameData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set());
  const [avatarError, setAvatarError] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

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
    const fetchDashboardData = async () => {
      // Clear cache first to ensure fresh data
      const cacheKey = 'dashboard_processed_cache';
      localStorage.removeItem(cacheKey);
      
      // Wait for auth to finish loading
      if (!user) {
        setLoading(false);
        return;
      }

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

        // Fetch all user picks WITH scores in a single optimized call!
        const picksResponse = await axios.get('/api/picks/user/all-with-scores', {
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

        // Process all games in parallel to fetch additional game info
        const gamePromises = userGames.map(async (gamePick) => {
          try {
            const totalUserScore = gamePick.scores?.totalScore || 0;

            // Try to get game info from scoreboard or summary
            let gameName = '';
            let gameStatus: 'pre' | 'in' | 'post' = 'post';
            let homeTeam: any = null;
            let awayTeam: any = null;

            // First priority: Check if teamData is stored (includes names & abbreviations)
            if (gamePick.teamData) {
              // Use stored team data - no need to fetch from ESPN API
              homeTeam = { 
                team: { 
                  displayName: gamePick.teamData.homeTeam.name,
                  abbreviation: gamePick.teamData.homeTeam.abbreviation,
                  // Use stored logo if available, otherwise construct from abbreviation
                  logo: (gamePick.teamData.homeTeam as any).logo || getTeamLogoUrl(gamePick.teamData.homeTeam.abbreviation, gamePick.teamData.league)
                } 
              };
              awayTeam = { 
                team: { 
                  displayName: gamePick.teamData.awayTeam.name,
                  abbreviation: gamePick.teamData.awayTeam.abbreviation,
                  // Use stored logo if available, otherwise construct from abbreviation
                  logo: (gamePick.teamData.awayTeam as any).logo || getTeamLogoUrl(gamePick.teamData.awayTeam.abbreviation, gamePick.teamData.league)
                } 
              };
              gameName = `${gamePick.teamData.awayTeam.abbreviation} @ ${gamePick.teamData.homeTeam.abbreviation}`;
              debugLog(`✅ Using stored teamData for game ${gamePick.gameId}:`, {
                away: gamePick.teamData.awayTeam.abbreviation,
                home: gamePick.teamData.homeTeam.abbreviation
              });
            } else {
              // Only fetch from ESPN API if we don't have stored teamData
              // This avoids 404 errors for old games no longer available in ESPN API
              try {
                debugLog(`📡 Fetching game info from ESPN API for ${gamePick.gameId}...`);
                const gameInfoResponse = await axios.get(getSummaryUrl(league, gamePick.gameId));
                const gameInfo = gameInfoResponse.data;
                
                if (gameInfo.header) {
                  const competition = gameInfo.header.competitions?.[0];
                  if (competition) {
                    const competitors = competition.competitors || [];
                    const apiHomeTeam = competitors.find((c: any) => c.homeAway === 'home');
                    const apiAwayTeam = competitors.find((c: any) => c.homeAway === 'away');
                    
                    if (apiHomeTeam) {
                      homeTeam = {
                        ...apiHomeTeam,
                        team: {
                          ...apiHomeTeam.team,
                          // Prefer stored logo from teamLogos, otherwise construct from abbreviation
                          logo: gamePick.teamLogos?.homeLogo || getTeamLogoUrl(apiHomeTeam.team.abbreviation, league)
                        }
                      };
                    }
                    if (apiAwayTeam) {
                      awayTeam = {
                        ...apiAwayTeam,
                        team: {
                          ...apiAwayTeam.team,
                          // Prefer stored logo from teamLogos, otherwise construct from abbreviation
                          logo: gamePick.teamLogos?.awayLogo || getTeamLogoUrl(apiAwayTeam.team.abbreviation, league)
                        }
                      };
                    }
                    
                    // Set game name from API
                    if (apiHomeTeam && apiAwayTeam) {
                      gameName = `${apiAwayTeam.team.abbreviation} @ ${apiHomeTeam.team.abbreviation}`;
                    }
                    
                    // Determine game status from API
                    if (competition.status?.type?.state === 'in') {
                      gameStatus = 'in';
                    } else if (competition.status?.type?.state === 'pre') {
                      gameStatus = 'pre';
                    }
                  }
                }
              } catch (err) {
                console.warn(`Could not fetch game info for ${gamePick.gameId} - using fallback`, err);
                // Fall through to fallback logic below
              }
            }
            
            // Final fallback - construct from team info if available
            if (!gameName && homeTeam && awayTeam) {
              const awayAbbr = awayTeam.team?.abbreviation || awayTeam.team?.displayName?.substring(0, 3).toUpperCase() || 'AWAY';
              const homeAbbr = homeTeam.team?.abbreviation || homeTeam.team?.displayName?.substring(0, 3).toUpperCase() || 'HOME';
              gameName = `${awayAbbr} @ ${homeAbbr}`;
            }
            
            // Absolute fallback
            if (!gameName) {
              gameName = `Game ${gamePick.gameId}`;
            }

            return {
              gameId: gamePick.gameId,
              gameName,
              homeTeam,
              awayTeam,
              picks: gamePick.picks,
              scores: gamePick.scores,
              totalUserScore,
              status: gameStatus,
              league: gamePick.teamData?.league || 'nfl' // Store the league for navigation
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
        
        // Cache the processed results
        localStorage.setItem(cacheKey, JSON.stringify({
          data: validGames,
          timestamp: Date.now()
        }));
        
        setGamesWithPicks(validGames);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard');
        setLoading(false);
      }
    };

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

  // Toggle game expansion
  const toggleGameExpansion = (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGames(prev => {
      const newSet = new Set(prev);
      if (newSet.has(gameId)) {
        newSet.delete(gameId);
      } else {
        newSet.add(gameId);
      }
      return newSet;
    });
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
    <div className="max-w-7xl mx-auto mt-2 px-2">
      {/* Welcome Section */}
      <div className="flex items-center gap-6">
        {/* Dancing gif with profile picture as head */}
        <div className="relative flex-shrink-0">
          <img
            src="/assets/football_dance.gif"
            alt="Dancing"
            className="w-24 h-24 object-contain mt-4"
          />
          {profilePicture && !avatarError ? (
            <img
              src={profilePicture}
              alt={user?.displayName || 'User'}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-2 border-neon-cyan shadow-lg object-cover bg-bg-dark/50"
              onError={() => setAvatarError(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-2 border-neon-cyan shadow-lg bg-bg-dark flex items-center justify-center">
              <FaUser className="text-neon-cyan text-sm" />
            </div>
          )}
        </div>
        
        {/* Welcome text */}
        <div className="flex-1">
          <h3 className="mb-0 text-left">
            Welcome back
          </h3>
          <h1>
            {renderTextWithEmojis(user?.displayName || 'Player')}!
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2">Here's your fantasy picks overview</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
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
        <div className="mb-6 bg-bg-dark/30 border border-neon-cyan/20 rounded-lg p-4">
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
      <div className="space-y-2">
        <h1 className="">
          {/* <FaFootballBall className="text-neon-pink" /> */}
          Your Games
        </h1>

        {gamesWithPicks.length === 0 ? (
          <div className="text-center py-6 bg-bg-dark/30 border border-neon-cyan/20 rounded-lg">
            <FaFootballBall className="text-6xl text-neon-pink mx-auto my-4 animate-bounce" />
            <h2 className="text-2xl font-bold mb-2">No Picks Yet</h2>
            <p className="text-gray-400 mb-6">Start making picks to see your dashboard!</p>
            <button
              onClick={() => navigate('/nfl/games')}
              className="btn-purple"
            >
              <FaGamepad className="inline mr-2" />
              Browse Games
            </button>
          </div>
        ) : (
          gamesWithPicks.map((game) => {
            const isExpanded = expandedGames.has(game.gameId);
            
            return (
          <div
            key={game.gameId}
            className="bg-bg-dark/50 border border-neon-cyan/20 rounded-lg overflow-hidden hover:border-neon-cyan/50 transition-all"
          >
            {/* Game Header - Mobile Optimized */}
            <button
              onClick={() => navigate(`/${game.league || 'nfl'}/game/${game.gameId}`)}
              className="w-full p-2 hover:bg-neon-cyan/5 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                {/* Team Logos with abbreviations below */}
                {game.awayTeam && game.homeTeam && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex flex-col items-center gap-1">
                      <img 
                        src={game.league === 'nfl' ? '/logos/logo-nfl.svg' : '/logos/logo-nba.svg'} 
                        alt={game.league?.toUpperCase()}
                        className="w-9 h-6 absolute -translate-y-[42px] translate-x-4 p-1 bg-bg-dark/50 rounded-md border border-neon-cyan/30"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <img 
                        src={game.awayTeam.team.logo} 
                        alt={game.awayTeam.team.abbreviation}
                        className="w-12 h-12"
                      />
                      <span className="text-[10px] font-semibold text-gray-400">
                        {game.awayTeam.team.abbreviation}
                      </span>
                    </div>
                    <span className="text-base font-bold text-gray-400">@</span>
                    <div className="flex flex-col items-center gap-1">
                      <img 
                        src={game.homeTeam.team.logo} 
                        alt={game.homeTeam.team.abbreviation}
                        className="w-12 h-12"
                      />
                      <span className="text-[10px] font-semibold text-gray-400">
                        {game.homeTeam.team.abbreviation}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Picks and Players info */}
                <div className="text-xs text-gray-400 flex-shrink-0 ml-2">
                  <div>{game.picks.length} pick{game.picks.length !== 1 ? 's' : ''}</div>
                  <div>{Array.from(new Set(game.picks.flatMap(pick => pick.players.map(p => p.id)))).length} players</div>
                </div>
                
                {/* Spacer */}
                <div className="flex-1"></div>
                
                {/* Score Display */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <FaTrophy className="text-neon-pink text-lg" />
                  <CountUpScore 
                    value={game.totalUserScore} 
                    className="text-2xl font-bold text-neon-pink"
                  />
                  <p className="text-[10px] text-gray-400">pts</p>
                </div>
                
                {/* Expand/Collapse Button */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGameExpansion(game.gameId, e);
                  }}
                  className="p-2 hover:bg-neon-cyan/10 rounded transition-all flex-shrink-0 cursor-pointer"
                  role="button"
                  aria-label="Toggle game details"
                >
                  {isExpanded ? (
                    <FaChevronUp className="text-neon-cyan text-lg" />
                  ) : (
                    <FaChevronDown className="text-neon-cyan text-lg" />
                  )}
                </div>
              </div>
            </button>

            {/* Expanded Players Section */}
            {isExpanded && (
              <div className="border-t border-neon-cyan/20 bg-bg-darker/30">
                <div className="p-4">
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

                  {/* View Game Details Button */}
                  <button
                    onClick={() => navigate(`/${game.league || 'nfl'}/game/${game.gameId}`)}
                    className="mt-4 w-full py-2 px-4 bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/30 rounded-lg text-neon-cyan font-semibold transition-all"
                  >
                    View Game Details →
                  </button>
                </div>
              </div>
            )}
          </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Dashboard;
