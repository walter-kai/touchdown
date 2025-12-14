import React, { useMemo, useState, useEffect } from 'react';
import { FaTrophy, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import axios from 'axios';
import { jwtStorage } from '../../../utils/jwtStorage';

interface TopPicksProps {
  gameId: string;
  homeTeamId: string;
  awayTeamId: string;
  playLog: Array<{
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
  }>;
  getTeamLogo: (team: any) => string;
  homeTeam: any;
  awayTeam: any;
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
  score: number;
  isUserPick: boolean;
}

const TopPicks: React.FC<TopPicksProps> = ({
  gameId,
  homeTeamId,
  awayTeamId,
  playLog,
  getTeamLogo,
  homeTeam,
  awayTeam,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userPickIds, setUserPickIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [userPickScores, setUserPickScores] = useState<Record<string, number>>({});

  // Fetch user picks from API
  useEffect(() => {
    const fetchUserPicks = async () => {
      try {
        setIsLoading(true);
        const token = jwtStorage.getToken();
        
        // Only fetch if user is authenticated
        if (!token) {
          console.log('⚠️ No JWT token found - user not authenticated');
          setUserPickIds(new Set());
          setIsLoading(false);
          return;
        }

        console.log(`🔍 Fetching user picks for game ${gameId}...`);
        const response = await axios.get(`/api/picks/game/${gameId}/user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('📦 Raw picks response:', response.data);
        
        // Extract players from the most recent pick submission
        let athleteIds: string[] = [];
        if (response.data?.picks?.picks && response.data.picks.picks.length > 0) {
          // Get the most recent pick (last in array)
          const latestPick = response.data.picks.picks[response.data.picks.picks.length - 1];
          const players = latestPick.players || [];
          athleteIds = players.map((p: any) => p.id);
          console.log(`✅ Found ${players.length} user picks from latest submission:`, players.map((p: any) => `${p.displayName} (${p.id})`));
        } else {
          console.log('⚠️ No picks found in response');
        }
        
        console.log('🎯 Athlete IDs from picks:', athleteIds);
        
        setUserPickIds(new Set(athleteIds));
      } catch (error) {
        console.error('❌ Failed to fetch user picks:', error);
        setUserPickIds(new Set());
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserPicks();
  }, [gameId]);

  // Calculate time-filtered scores for user picks (same logic as YourPicks)
  useEffect(() => {
    if (userPickIds.size === 0 || playLog.length === 0) {
      setUserPickScores({});
      return;
    }

    console.log('🔄 TopPicks: Calculating time-filtered user scores...');
    
    // Get lock times from localStorage
    const storageKey = `playerPick_${homeTeamId}_${awayTeamId}`;
    const savedState = localStorage.getItem(storageKey);
    
    if (!savedState) {
      console.warn('⚠️ TopPicks: No saved state found in localStorage');
      setUserPickScores({});
      return;
    }

    let playerHistory: Record<string, Array<{ start: number; end?: number }>> = {};
    let currentPlayerLockTimes: Record<string, number> = {};
    let globalLockedAt: number | null = null;

    try {
      const parsed = JSON.parse(savedState);
      playerHistory = parsed.playerHistory || {};
      currentPlayerLockTimes = parsed.playerLockTimes || {};
      globalLockedAt = parsed.lockedAt || null;
      console.log('💾 TopPicks: Player lock times:', currentPlayerLockTimes);
      console.log('💾 TopPicks: Global locked at:', globalLockedAt);
    } catch (e) {
      console.error('❌ TopPicks: Error parsing saved state:', e);
      setUserPickScores({});
      return;
    }

    const scores: Record<string, number> = {};
    
    // Calculate score for each user pick
    Array.from(userPickIds).forEach(playerId => {
      scores[playerId] = 0;
      
      // Get all time periods this player was active
      let activePeriods = playerHistory[playerId] || [];
      
      // Add current active period if player is currently locked
      if (currentPlayerLockTimes[playerId]) {
        activePeriods.push({ start: currentPlayerLockTimes[playerId] });
      }
      
      // Fallback: If no specific player lock time, use the global lockedAt
      if (activePeriods.length === 0 && globalLockedAt) {
        activePeriods = [{ start: globalLockedAt }];
      }
      
      if (activePeriods.length === 0) {
        console.warn(`⚠️ TopPicks: No active periods for player ${playerId}`);
        return;
      }
      
      // Count plays that occurred during active periods
      playLog.forEach(play => {
        if (play.athletesInvolved) {
          const isInvolved = play.athletesInvolved.some(a => a.id === playerId);
          if (isInvolved) {
            const playTimestamp = play.timestamp instanceof Date ? play.timestamp.getTime() : new Date(play.timestamp).getTime();
            
            // Check if play occurred during any of the player's active periods
            const playDuringActivePeriod = activePeriods.some(period => {
              const afterStart = playTimestamp >= period.start;
              const beforeEnd = !period.end || playTimestamp <= period.end;
              return afterStart && beforeEnd;
            });
            
            if (playDuringActivePeriod) {
              scores[playerId]++;
            }
          }
        }
      });
      
      console.log(`✅ TopPicks: Player ${playerId} score: ${scores[playerId]}`);
    });

    setUserPickScores(scores);
  }, [userPickIds, playLog, homeTeamId, awayTeamId]);

  // Calculate top picks from play log
  const topPicks = useMemo(() => {
    console.log('🔄 Recalculating top picks...');
    console.log('📊 User pick IDs:', Array.from(userPickIds));
    console.log('📝 Total plays in log:', playLog.length);

    // Build a map of all athletes who have scored
    const athleteScores = new Map<string, PlayerScore>();

    playLog.forEach((play) => {
      if (play.athletesInvolved) {
        play.athletesInvolved.forEach((athlete) => {
          if (!athleteScores.has(athlete.id)) {
            const isUserPick = userPickIds.has(athlete.id);
            if (isUserPick) {
              console.log(`⭐ Found user pick in play log: ${athlete.displayName} (ID: ${athlete.id})`);
            }
            athleteScores.set(athlete.id, {
              id: athlete.id,
              fullName: athlete.fullName,
              displayName: athlete.displayName,
              shortName: athlete.shortName,
              headshot: athlete.headshot,
              jersey: athlete.jersey,
              position: athlete.position,
              teamId: athlete.team.id,
              score: 0,
              isUserPick,
            });
          }
          // Increment score
          const current = athleteScores.get(athlete.id)!;
          current.score += 1;
        });
      }
    });

    // Convert to array and sort by score descending
    const sorted = Array.from(athleteScores.values())
      .filter(player => player.score > 0)
      .sort((a, b) => b.score - a.score);
    
    const userPicks = sorted.filter(p => p.isUserPick);
    console.log(`✅ Total players with scores: ${sorted.length}, User picks: ${userPicks.length}`);
    
    return sorted;
  }, [playLog, userPickIds]);

  if (topPicks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#b0b7bf] text-lg">No players have scored yet.</p>
        <p className="text-[#b0b7bf] text-sm mt-2">Check back when the game starts!</p>
      </div>
    );
  }

  // Calculate total user score using time-filtered scores
  const userTotalScore = Object.values(userPickScores).reduce((sum, score) => sum + score, 0);

  const displayedPicks = isExpanded ? topPicks : topPicks.slice(0, 5);
  const hasMore = topPicks.length > 5;

  return (
    <div className="space-y-4">
      {/* Divider */}
      <div className="border-t-2 border-[#00ffe7]/20 pt-2 mb-4"></div>  
      <div className='mx-2'>
        <div className="flex items-center justify-between mb-4">
          <h1>Top Picks</h1>
          {userTotalScore > 0 && (
            <div className="relative bg-gradient-to-r from-[#00ffe7]/30 to-[#faafe8]/30 border-2 border-[#00ffe7] rounded-lg px-5 py-3 shadow-[0_0_20px_rgba(0,255,231,0.4)]">
              <div className="absolute inset-0 bg-[#00ffe7] blur-xl opacity-20 animate-pulse"></div>
              <div className="relative flex flex-col items-center">
                <div className="flex items-baseline gap-1">
                  <span className="text-[#00ffe7] font-bold text-3xl drop-shadow-[0_0_10px_rgba(0,255,231,0.8)]">{userTotalScore}</span>
                  <span className="text-[#00ffe7]/80 text-sm font-semibold">pts</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="border border-[#00ffe7]/20 bg-[#181a23]/50">
          {/* Header Row - Only show when user has picks */}
          {userTotalScore > 0 && (
            <div className="bg-[#00ffe7]/10 border-b-2 border-[#00ffe7]/30 py-2 flex items-center justify-end sticky top-0 z-10 pr-3">
              <div className="flex items-center" style={{ gap: '12px' }}>
                <div className="text-[10px] text-[#00ffe7] font-bold text-center" style={{ width: '80px' }}>
                  YOUR SCORE
                </div>
                <div className="text-[10px] text-[#b0b7bf] font-bold text-center" style={{ width: '80px' }}>
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
                    relative border-b border-[#00ffe7]/10 last:border-b-0 transition-all
                    ${player.isUserPick
                      ? 'bg-gradient-to-r from-[#00ffe7]/20 via-[#00ffe7]/10 to-transparent border-l-4 border-l-[#00ffe7] shadow-[0_0_15px_rgba(0,255,231,0.3)]'
                      : 'hover:bg-[#00ffe7]/5'
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
                      'bg-[#00ffe7]/80 text-black'}
                    `}>
                      {index + 1}
                    </div>
                    
                    {/* Player Image */}
                    <div className="flex-shrink-0 ml-3">
                      <div className={player.isUserPick ? 'relative' : ''}>
                        {player.isUserPick && (
                          <div className="absolute inset-0 rounded-full bg-[#00ffe7] blur-md opacity-50 animate-pulse"></div>
                        )}
                        <img
                          src={player.headshot}
                          alt={player.displayName}
                          className={`
                            relative w-14 h-14 rounded-full border-2 object-cover
                            ${player.isUserPick ? 'border-[#00ffe7]' : 'border-[#00ffe7]/30'}
                          `}
                          onError={(e) => {
                            e.currentTarget.src = `https://via.placeholder.com/64?text=${player.shortName}`;
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className={`font-bold text-base truncate ${player.isUserPick ? 'text-[#00ffe7] drop-shadow-[0_0_8px_rgba(0,255,231,0.8)]' : 'text-white'}`}>
                          {player.shortName || player.displayName}
                        </h4>

                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={player.isUserPick ? 'text-[#00ffe7]/80' : 'text-[#b0b7bf]'}>
                          {player.position} • #{player.jersey}
                        </span>
                        <div className="flex items-center gap-1">
                          <img
                            src={getTeamLogo(team)}
                            alt=""
                            className="w-3 h-3"
                          />
                          <span className={`text-[10px] ${player.isUserPick ? 'text-[#00ffe7]/80' : 'text-[#b0b7bf]'}`}>
                            {team?.team?.abbreviation}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Score */}
                    <div className="flex-shrink-0 text-right pr-3">
                      {player.isUserPick ? (
                        // For user picks, show both their score and total score (without headers)
                        <div className="flex items-center" style={{ gap: '12px' }}>
                          <div className="text-2xl font-bold text-[#00ffe7] drop-shadow-[0_0_10px_rgba(0,255,231,0.8)] text-center" style={{ width: '80px' }}>
                            {userPickScores[player.id] || 0}
                          </div>
                          <div className="text-2xl font-bold text-white text-center" style={{ width: '80px' }}>
                            {player.score}
                          </div>
                        </div>
                      ) : (
                        // For non-user picks, show total score aligned to the right column
                        <div className="flex items-center" style={{ gap: '12px' }}>
                          <div style={{ width: '80px' }}></div>
                          <div className="text-3xl font-bold text-white text-center" style={{ width: '80px' }}>
                            {player.score}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expand Button */}
          {hasMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="btn-green w-full mt-2 flex items-center justify-center gap-2"
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
          )}
      </div>
    </div>
  );
};

export default TopPicks;
