import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTrophy, FaGamepad, FaFire, FaChartLine } from 'react-icons/fa';
import LoadingFootball from '@/components/common/LoadingFootball';

interface UserStats {
  displayName: string;
  photoUrl?: string;
  totalScore: number;
  gamesPlayed: number;
  rank?: number;
  totalUsers?: number;
  averageScore?: number;
  bestGame?: number;
  recentGames?: Array<{
    gameId: string;
    gameName: string;
    score: number;
    date: string;
  }>;
}

const UserInfo: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!userId) {
        setError('User ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/user/${userId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }

        const data = await response.json();
        console.log('User stats:', data);
        
        if (data.ok && data.user) {
          // Calculate average score
          const averageScore = data.user.gamesPlayed > 0 
            ? Math.round(data.user.totalScore / data.user.gamesPlayed) 
            : 0;

          setUserStats({
            ...data.user,
            averageScore
          });
        } else {
          setError('Could not load user information');
        }
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [userId]);

  if (loading) {
    return <LoadingFootball message="Loading user profile..." />;
  }

  if (error || !userStats) {
    return (
      <div className="min-h-screen bg-bg-darker flex items-center justify-center">
        <div className="text-center">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-neon-cyan hover:text-neon-cyan/80 transition-colors"
          >
            <FaArrowLeft />
            Go Back
          </button>
          <p className="text-text-light text-lg">{error || 'User not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-darker py-6">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-neon-cyan hover:text-neon-cyan/80 transition-colors"
        >
          <FaArrowLeft />
          Back
        </button>

        {/* User Profile Card */}
        <div className="bg-bg-dark border border-neon-cyan/20 rounded-lg p-6 mb-6">
          {/* Header with Photo and Basic Info */}
          <div className="flex items-center gap-4 mb-6">
            {userStats.photoUrl && (
              <img
                src={userStats.photoUrl}
                alt={userStats.displayName}
                className="w-20 h-20 rounded-full border-2 border-neon-cyan"
              />
            )}
            <div>
              <h1 className="text-white text-3xl font-bold">{userStats.displayName}</h1>
              {userStats.rank && userStats.totalUsers && (
                <p className="text-neon-cyan text-sm mt-1">
                  Rank #{userStats.rank} of {userStats.totalUsers}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-neon-cyan/10 pt-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Total Score */}
              <div className="bg-bg-darker/50 rounded-lg p-4 text-center">
                <div className="text-text-muted text-xs mb-2 flex items-center justify-center gap-1">
                  <FaTrophy className="text-yellow-400" />
                  Total Score
                </div>
                <div className="text-neon-pink font-bold text-2xl">
                  {userStats.totalScore}
                </div>
                <div className="text-text-muted text-xs mt-1">pts</div>
              </div>

              {/* Games Played */}
              <div className="bg-bg-darker/50 rounded-lg p-4 text-center">
                <div className="text-text-muted text-xs mb-2 flex items-center justify-center gap-1">
                  <FaGamepad className="text-neon-cyan" />
                  Games
                </div>
                <div className="text-neon-cyan font-bold text-2xl">
                  {userStats.gamesPlayed}
                </div>
                <div className="text-text-muted text-xs mt-1">played</div>
              </div>

              {/* Average Score */}
              <div className="bg-bg-darker/50 rounded-lg p-4 text-center">
                <div className="text-text-muted text-xs mb-2 flex items-center justify-center gap-1">
                  <FaChartLine className="text-neon-pink" />
                  Average
                </div>
                <div className="text-neon-pink font-bold text-2xl">
                  {userStats.averageScore}
                </div>
                <div className="text-text-muted text-xs mt-1">per game</div>
              </div>

              {/* Best Game */}
              {userStats.bestGame !== undefined && (
                <div className="bg-bg-darker/50 rounded-lg p-4 text-center">
                  <div className="text-text-muted text-xs mb-2 flex items-center justify-center gap-1">
                    <FaFire className="text-orange-400" />
                    Best Game
                  </div>
                  <div className="text-orange-400 font-bold text-2xl">
                    {userStats.bestGame}
                  </div>
                  <div className="text-text-muted text-xs mt-1">pts</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Games Section */}
        {userStats.recentGames && userStats.recentGames.length > 0 && (
          <div className="bg-bg-dark border border-neon-cyan/20 rounded-lg p-6">
            <h2 className="text-neon-cyan font-bold text-lg mb-4">Recent Games</h2>
            <div className="space-y-3">
              {userStats.recentGames.map((game, idx) => (
                <div key={`${game.gameId}-${idx}`} className="bg-bg-darker/50 rounded-lg p-3 flex items-center justify-between hover:bg-bg-darker/70 transition-colors cursor-pointer">
                  <div className="flex-1">
                    <p className="text-text-light font-semibold text-sm">{game.gameName}</p>
                    <p className="text-text-muted text-xs mt-1">
                      {new Date(game.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-neon-pink font-bold text-lg">{game.score}</p>
                    <p className="text-text-muted text-xs">pts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserInfo;
