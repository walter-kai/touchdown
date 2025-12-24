import React, { useMemo, useState, useEffect } from 'react';
import { FaTrophy, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import axios from 'axios';
import { jwtStorage } from '../../../utils/jwtStorage';
import { usePicks } from '../../../providers/PicksContext';
import { debugLog } from '@/utils/debugLog';
import { Play } from '@/types/espn/playByplay';
import { useLeague } from '@/providers/LeagueContext';

interface TopPicksProps {
  gameId: string;
  homeTeamId: string;
  awayTeamId: string;
  playLog: Play[];
  getTeamLogo: (team: any) => string;
  homeTeam: any;
  awayTeam: any;
  isGameInSession: boolean;
}

interface PlayerScore {
  id: string;
  fullName: string;
  displayName: string;
  shortName: string;
  headshot: string;
  jersey: string;
  position: string;
  teamId: string;
  gameScore: number; // Total points in game
  userScore: number; // Total accumulated score for user
  isUserPick: boolean; // Has score (current or historical)
  isCurrentPick: boolean; // Currently active pick
}

const TopPicks: React.FC<TopPicksProps> = ({
  gameId,
  homeTeamId,
  awayTeamId,
  playLog,
  getTeamLogo,
  homeTeam,
  awayTeam,
  isGameInSession,
}) => {
  const { getHeadshotUrl } = useLeague();
  const [isExpanded, setIsExpanded] = useState(false);
  const [userPickIds, setUserPickIds] = useState<Set<string>>(new Set());
  const [currentPickIds, setCurrentPickIds] = useState<Set<string>>(new Set()); // Currently active picks only
  const [isLoading, setIsLoading] = useState(true);
  
  // Use picks context for scores
  const { fetchScores, getScores } = usePicks();

  // Fetch user picks and scores from API
  useEffect(() => {
    const fetchUserPicksAndScores = async () => {
      try {
        setIsLoading(true);
        const token = jwtStorage.getToken();
        
        // Only fetch if user is authenticated
        if (!token) {
          debugLog('⚠️ No JWT token found - user not authenticated');
          setUserPickIds(new Set());
          setIsLoading(false);
          return;
        }

        debugLog(`🔍 Fetching user picks and scores for game ${gameId}...`);
        
        // Fetch user picks
        const picksResponse = await axios.get(`/api/picks/game/${gameId}/user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        debugLog('📦 Raw picks response:', picksResponse.data);
        
        // Extract players from the most recent pick submission
        let athleteIds: string[] = [];
        
        if (picksResponse.data?.picks?.picks && picksResponse.data.picks.picks.length > 0) {
          // Get the most recent pick (last in array)
          const latestPick = picksResponse.data.picks.picks[picksResponse.data.picks.picks.length - 1];
          const players = latestPick.players || [];
          
          // Extract CURRENT pick IDs from latest submission
          const currentIds = new Set<string>(players.map((p: any) => p.id).filter(Boolean));
          
          // Collect ALL unique player IDs across ALL pick submissions
          const allPickSubmissions = picksResponse.data.picks.picks;
          const allPlayerIds = new Set<string>();
          
          allPickSubmissions.forEach((pick: any) => {
            const pickPlayers = pick.players || [];
            pickPlayers.forEach((p: any) => {
              if (p.id) allPlayerIds.add(p.id);
            });
            
            // Also include players from playerHistory in each pick submission
            const pickHistory = pick.playerHistory || {};
            Object.keys(pickHistory).forEach(playerId => {
              allPlayerIds.add(playerId);
            });
          });
          
          athleteIds = Array.from(allPlayerIds);
          
          debugLog(`✅ Found ${allPlayerIds.size} total unique players across ${allPickSubmissions.length} pick submissions`);
          debugLog('📚 All player IDs ever picked:', athleteIds);
          debugLog('🎯 Current active picks:', Array.from(currentIds));
          
          setCurrentPickIds(currentIds);
        } else {
          debugLog('⚠️ No picks found in response');
        }
        
        debugLog('🎯 Athlete IDs from picks:', athleteIds);
        setUserPickIds(new Set(athleteIds));
        
        // Fetch scores from API
        await fetchScores(gameId);
      } catch (error) {
        console.error('❌ Failed to fetch user picks or scores:', error);
        setUserPickIds(new Set());
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserPicksAndScores();
  }, [gameId, homeTeamId, awayTeamId, fetchScores]);

  // Calculate top picks from play log using context scores
  const topPicks = useMemo(() => {
    debugLog('🔄 Recalculating top picks using context scores...');
    debugLog('📊 User pick IDs:', Array.from(userPickIds));
    debugLog('📝 Total plays in log:', playLog.length);

    // Get scores from context
    const scores = getScores(gameId);
    
    if (!scores) {
      console.warn('⚠️ No scores available from context yet');
      return [];
    }

    debugLog('📊 Scores from context:', scores);

    // Build a map of all athletes with scores
    const athleteScores = new Map<string, PlayerScore>();

    playLog.forEach((play) => {
      if (play.athletesInvolved && play.athletesInvolved.length > 0) {
        play.athletesInvolved.forEach((athlete) => {
          if (!athleteScores.has(athlete.id)) {
            const hasScore = userPickIds.has(athlete.id);
            const isCurrentPick = currentPickIds.has(athlete.id);
            
            athleteScores.set(athlete.id, {
              id: athlete.id,
              fullName: athlete.fullName || athlete.displayName,
              displayName: athlete.displayName,
              shortName: athlete.shortName || athlete.displayName,
              headshot: getHeadshotUrl({ id: athlete.id, headshot: athlete.headshot }),
              jersey: athlete.jersey || '',
              position: athlete.position || '',
              teamId: athlete.team?.id || '',
              gameScore: scores.gameScores[athlete.id] || 0,
              userScore: scores.userScores[athlete.id] || 0,
              isUserPick: hasScore,
              isCurrentPick: isCurrentPick,
            });
          }
        });
      }
    });

    // Convert to array and sort by game score descending
    const sorted = Array.from(athleteScores.values())
      .sort((a, b) => b.gameScore - a.gameScore);
    
    const userPicks = sorted.filter(p => p.isUserPick);
    debugLog(`✅ Total players with scores: ${sorted.length}, User picks: ${userPicks.length}`);
    
    return sorted;
  }, [playLog, userPickIds, currentPickIds, gameId, getScores]);

  // Calculate total user score from the topPicks data
  const userTotalScore = topPicks
    .filter(p => p.isUserPick)
    .reduce((sum, player) => sum + player.userScore, 0);

  const displayedPicks = isExpanded ? topPicks : topPicks.slice(0, 5);
  const hasMore = topPicks.length > 5;

  return (
    <div className="space-y-4 p">
      {/* Divider */}
      <div className="border-t-2 border-neon-cyan/20 pt-2 mb-4"></div>  
      <div className='mx-2'>
        <div className="flex items-center justify-between mb-4">
          <h1>Top Picks</h1>
          {userTotalScore > 0 && (
            <div className="relative bg-gradient-to-r from-neon-cyan/30 to-neon-pink/30 border-2 border-neon-cyan rounded-lg px-5 py-3 shadow-[0_0_20px_rgba(0,255,231,0.4)]">
              <div className="absolute inset-0 bg-neon-cyan blur-xl opacity-20 animate-pulse"></div>
              <div className="relative flex flex-col items-center">
                <div className="flex items-baseline gap-1">
                  <span className="text-neon-cyan font-bold text-3xl drop-shadow-[0_0_10px_rgba(0,255,231,0.8)]">{userTotalScore}</span>
                  <span className="text-neon-cyan/80 text-sm font-semibold">pts</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="border border-neon-cyan/20 bg-bg-dark/50">
          {/* Header Row - Show when user has any picks */}
          {userPickIds.size > 0 && (
            <div className="bg-neon-cyan/10 border-b-2 border-neon-cyan/30 py-2 flex items-center justify-end sticky top-0 z-10 pr-3">
              <div className="flex items-center" style={{ gap: '12px' }}>
                <div className="text-[10px] text-neon-cyan font-bold text-center" style={{ width: '80px' }}>
                  YOUR SCORE
                </div>
                <div className="text-[10px] text-text-muted font-bold text-center" style={{ width: '80px' }}>
                  TOTAL
                </div>
              </div>
            </div>
          )}
          {displayedPicks.map((player, index) => {
              const team = player.teamId === homeTeam?.id ? homeTeam : awayTeam;
              const teamColor = team?.team?.color || '00ffe7';
              const isHome = player.teamId === homeTeam?.id;
          
              return (
                <div
                  key={player.id}
                  className={`
                    relative border-b border-neon-cyan/10 last:border-b-0 transition-all
                    ${player.isCurrentPick && isGameInSession
                      ? 'bg-gradient-to-r from-neon-cyan/20 via-neon-cyan/10 to-transparent border-l-4 border-l-neon-cyan shadow-[0_0_15px_rgba(0,255,231,0.3)]'
                      : 'hover:bg-neon-cyan/5'
                    }
                  `}
                >
                  <div className="py-2 pr-3 flex items-center gap-3 relative">
                    {/* Rank Badge - Small, absolute top-left */}
                    <div className={`
                      absolute top-2 left-2 z-20 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs
                      ${index === 0 ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]' :
                      index === 1 ? 'bg-gray-400 text-black shadow-[0_0_10px_rgba(156,163,175,0.5)]' :
                      index === 2 ? 'bg-amber-700 text-white shadow-[0_0_10px_rgba(180,83,9,0.5)]' :
                      'bg-neon-cyan/80 text-black'}
                    `}>
                      {index + 1}
                    </div>
                    
                    {/* Player Image */}
                    <div className="flex-shrink-0 ml-3">
                      <div className={player.isCurrentPick && isGameInSession ? 'relative' : ''}>
                        {player.isCurrentPick && isGameInSession && (
                          <div className="absolute inset-0 rounded-full bg-neon-cyan blur-md opacity-50 animate-pulse"></div>
                        )}
                        {player.headshot ? (
                          <img
                            src={player.headshot}
                            alt={player.displayName}
                            className={`
                              relative w-14 h-14 rounded-full border-2 object-cover
                              ${player.isCurrentPick && isGameInSession ? 'border-neon-cyan' : 'border-neon-cyan/30'}
                            `}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`
                            relative w-14 h-14 rounded-full border-2 bg-bg-darker items-center justify-center
                            ${player.isCurrentPick && isGameInSession ? 'border-neon-cyan' : 'border-neon-cyan/30'}
                          `}
                          style={{ display: player.headshot ? 'none' : 'flex' }}
                        >
                          <span className="text-xs font-bold text-neon-cyan">{player.shortName?.substring(0, 2) || 'P'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className={`font-bold text-base truncate ${player.isCurrentPick && isGameInSession ? 'text-neon-cyan drop-shadow-[0_0_8px_rgba(0,255,231,0.8)]' : 'text-white'}`}>
                          {player.shortName || player.displayName}
                        </h4>

                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={player.isCurrentPick && isGameInSession ? 'text-neon-cyan/80' : 'text-text-muted'}>
                          {player.position} • #{player.jersey}
                        </span>
                        <div className="flex items-center gap-1">
                          <img
                            src={getTeamLogo(team)}
                            alt=""
                            className="w-3 h-3"
                          />
                          <span className={`text-[10px] ${player.isCurrentPick && isGameInSession ? 'text-neon-cyan/80' : 'text-text-muted'}`}>
                            {team?.team?.abbreviation}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Score */}
                    <div className="flex-shrink-0 text-right pr-3">
                      {player.isUserPick ? (
                        // For user picks, show user score and game score
                        <div className="flex items-center" style={{ gap: '12px' }}>
                          <div className="text-2xl font-bold text-neon-cyan drop-shadow-[0_0_10px_rgba(0,255,231,0.8)] text-center" style={{ width: '80px' }}>
                            {player.userScore}
                          </div>
                          <div className="text-2xl font-bold text-white text-center" style={{ width: '80px' }}>
                            {player.gameScore}
                          </div>
                        </div>
                      ) : (
                        // For non-user picks, show game score aligned to the right column
                        <div className="flex items-center" style={{ gap: '12px' }}>
                          <div style={{ width: '80px' }}></div>
                          <div className="text-3xl font-bold text-white text-center" style={{ width: '80px' }}>
                            {player.gameScore}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Expand Button */}
          {hasMore && (
            <div className="border-t border-neon-cyan/20 p-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="btn-green w-full flex items-center justify-center gap-2"
              >
                {isExpanded ? (
                  <>
                    <FaChevronUp />
                    Show Less
                  </>
                ) : (
                  <>
                    <FaChevronDown />
                    Show All ({topPicks.length})
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopPicks;
