import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaFootballBall, FaTrophy, FaChartBar, FaGamepad } from 'react-icons/fa';
import { jwtStorage } from '../../utils/jwtStorage';
import LoadingFootball from '../../components/common/LoadingFootball';
import { useAuth } from '../../providers/AuthContext';

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
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [gamesWithPicks, setGamesWithPicks] = useState<GameData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch all user picks and related game data
  useEffect(() => {
    const fetchDashboardData = async () => {
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

        // Fetch all user picks WITH scores in a single optimized call!
        const picksResponse = await axios.get('/api/picks/user/all-with-scores', {
          headers: { Authorization: `Bearer ${token}` }
        });

        interface GamePickWithScores extends GamePick {
          scores: GameScores;
        }

        const userGames: GamePickWithScores[] = picksResponse.data.games || [];
        console.log('📊 User games with picks and scores:', userGames);

        if (userGames.length === 0) {
          setGamesWithPicks([]);
          setLoading(false);
          return;
        }

        // Process all games in parallel to fetch additional game info
        const gamePromises = userGames.map(async (gamePick) => {
          try {
            const totalUserScore = gamePick.scores?.totalScore || 0;

            // Try to get game info from scoreboard or summary (optional)
            let gameName = `Game ${gamePick.gameId}`;
            let gameStatus: 'pre' | 'in' | 'post' = 'post';
            let homeTeam: any = null;
            let awayTeam: any = null;

            try {
              // Try to fetch from ESPN API or cache
              const gameInfoResponse = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gamePick.gameId}`);
              const gameInfo = gameInfoResponse.data;
              
              if (gameInfo.header) {
                const competition = gameInfo.header.competitions?.[0];
                if (competition) {
                  const competitors = competition.competitors || [];
                  homeTeam = competitors.find((c: any) => c.homeAway === 'home');
                  awayTeam = competitors.find((c: any) => c.homeAway === 'away');
                  
                  if (homeTeam && awayTeam) {
                    gameName = `${awayTeam.team.abbreviation} @ ${homeTeam.team.abbreviation}`;
                  }

                  // Determine game status
                  if (competition.status?.type?.state === 'in') {
                    gameStatus = 'in';
                  } else if (competition.status?.type?.state === 'pre') {
                    gameStatus = 'pre';
                  }
                }
              }
            } catch (err) {
              console.warn(`Could not fetch game info for ${gamePick.gameId}`);
            }

            return {
              gameId: gamePick.gameId,
              gameName,
              homeTeam,
              awayTeam,
              picks: gamePick.picks,
              scores: gamePick.scores,
              totalUserScore,
              status: gameStatus
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

  if (gamesWithPicks.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center py-20">
          <FaFootballBall className="text-6xl text-[#faafe8] mx-auto mb-4 animate-bounce" />
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
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 pb-24">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Welcome back{user?.displayName ? `, ${user.displayName}` : ''}! 🏈
        </h1>
        <p className="text-gray-400">Here's your fantasy picks overview</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#181a23]/50 border border-[#00ffe7]/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <FaGamepad className="text-2xl text-[#00ffe7]" />
            <h3 className="text-lg font-semibold">Games Played</h3>
          </div>
          <p className="text-4xl font-bold text-[#00ffe7]">{overallStats.totalGames}</p>
        </div>

        <div className="bg-[#181a23]/50 border border-[#faafe8]/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <FaTrophy className="text-2xl text-[#faafe8]" />
            <h3 className="text-lg font-semibold">Total Score</h3>
          </div>
          <p className="text-4xl font-bold text-[#faafe8]">{overallStats.totalScore}</p>
        </div>

        <div className="bg-[#181a23]/50 border border-[#00ffe7]/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <FaChartBar className="text-2xl text-[#00ffe7]" />
            <h3 className="text-lg font-semibold">Unique Players</h3>
          </div>
          <p className="text-4xl font-bold text-[#00ffe7]">{overallStats.totalPlayers}</p>
        </div>
      </div>

      {/* Games List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FaFootballBall className="text-[#faafe8]" />
          Your Games
        </h2>

        {gamesWithPicks.map((game) => (
          <div
            key={game.gameId}
            className="bg-[#181a23]/50 border border-[#00ffe7]/20 rounded-lg overflow-hidden hover:border-[#00ffe7]/50 transition-all cursor-pointer"
            onClick={() => navigate(`/nfl/game/${game.gameId}`)}
          >
            {/* Game Header */}
            <div className="p-4 bg-[#00ffe7]/10 border-b border-[#00ffe7]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {game.awayTeam && game.homeTeam && (
                    <>
                      <img 
                        src={game.awayTeam.team.logo} 
                        alt={game.awayTeam.team.abbreviation}
                        className="w-10 h-10"
                      />
                      <span className="text-xl font-bold">@</span>
                      <img 
                        src={game.homeTeam.team.logo} 
                        alt={game.homeTeam.team.abbreviation}
                        className="w-10 h-10"
                      />
                    </>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{game.gameName}</h3>
                    <p className="text-sm text-gray-400">
                      {game.picks.length} pick{game.picks.length !== 1 ? 's' : ''} made
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <FaTrophy className="text-[#faafe8]" />
                    <span className="text-3xl font-bold text-[#faafe8]">
                      {game.totalUserScore}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Total Score</p>
                </div>
              </div>
            </div>

            {/* Players List */}
            <div className="p-4">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FaChartBar className="text-[#00ffe7]" />
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
                        className="flex items-center justify-between px-3 bg-[#181a23]/30 rounded-lg hover:bg-[#181a23]/50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {player.headshot && (
                            <img
                              src={player.headshot}
                              alt={player.displayName}
                              className="w-16 h-12 rounded-full bg-[#00ffe7]/10"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <p className="font-semibold text-white">{player.displayName}</p>
                            <p className="text-sm text-gray-400">{player.position}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-[#00ffe7]">
                              {userScore}
                            </span>
                            <span className="text-sm text-gray-400">
                              / {gameScore}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">Your Score / Total</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
