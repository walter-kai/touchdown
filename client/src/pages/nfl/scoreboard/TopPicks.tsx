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
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userPickIds, setUserPickIds] = useState<Set<string>>(new Set());
  const [currentPickIds, setCurrentPickIds] = useState<Set<string>>(new Set()); // Currently active picks only
  const [isLoading, setIsLoading] = useState(true);
  const [userPickScores, setUserPickScores] = useState<Record<string, number>>({});
  const [playerHistory, setPlayerHistory] = useState<Record<string, Array<{ start: number; end?: number }>>>({});
  const [playerLockTimes, setPlayerLockTimes] = useState<Record<string, number>>({});
  const [globalLockedAt, setGlobalLockedAt] = useState<number | null>(null);

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
          
          // Extract CURRENT pick IDs from latest submission
          const currentIds = new Set<string>(players.map((p: any) => p.id).filter(Boolean));
          
          // Extract lock time data from API response
          const apiPlayerHistory = latestPick.playerHistory || {};
          const apiPlayerLockTimes = latestPick.playerLockTimes || {};
          const apiGlobalLockedAt = latestPick.lockedAt || null;
          
          // Collect ALL unique player IDs across ALL pick submissions
          const allPickSubmissions = response.data.picks.picks;
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
          
          console.log(`✅ Found ${allPlayerIds.size} total unique players across ${allPickSubmissions.length} pick submissions`);
          console.log('📚 All player IDs ever picked:', athleteIds);
          console.log('🎯 Current active picks:', Array.from(currentIds));
          console.log('� Lock data from API:', { apiPlayerHistory, apiPlayerLockTimes, apiGlobalLockedAt });
          
          // Set lock time state
          setPlayerHistory(apiPlayerHistory);
          setPlayerLockTimes(apiPlayerLockTimes);
          setGlobalLockedAt(apiGlobalLockedAt);
          setCurrentPickIds(currentIds);
          
          // Save to localStorage for consistency
          const storageKey = `playerPick_${homeTeamId}_${awayTeamId}`;
          // Convert athleteIds back to player objects for localStorage compatibility
          const allPlayerObjects = athleteIds.map(id => {
            // Try to find player data from any pick submission
            for (const pick of allPickSubmissions) {
              const player = (pick.players || []).find((p: any) => p.id === id);
              if (player) return player;
            }
            // Fallback if player not found in current picks (was removed)
            return { id };
          });
          localStorage.setItem(storageKey, JSON.stringify({
            players: allPlayerObjects,
            lockedAt: apiGlobalLockedAt,
            playerLockTimes: apiPlayerLockTimes,
            playerHistory: apiPlayerHistory
          }));
        } else {
          console.log('⚠️ No picks found in response');
        }
        
        console.log('🎯 Athlete IDs from picks:', athleteIds);
        
        setUserPickIds(new Set(athleteIds));
      } catch (error) {
        console.error('❌ Failed to fetch user picks:', error);
        setUserPickIds(new Set());
        
        // Fallback to localStorage if API fails
        const storageKey = `playerPick_${homeTeamId}_${awayTeamId}`;
        const savedState = localStorage.getItem(storageKey);
        if (savedState) {
          try {
            const parsed = JSON.parse(savedState);
            
            // Include currently active players
            let currentIds = (parsed.players || []).map((p: any) => p.id);
            
            // Also include ALL players from playerHistory
            const apiPlayerHistory = parsed.playerHistory || {};
            const historicalPlayerIds = Object.keys(apiPlayerHistory);
            const allPlayerIds = [...new Set([...currentIds, ...historicalPlayerIds])];
            
            setUserPickIds(new Set(allPlayerIds));
            setCurrentPickIds(new Set(currentIds));
            setPlayerHistory(apiPlayerHistory);
            setPlayerLockTimes(parsed.playerLockTimes || {});
            setGlobalLockedAt(parsed.lockedAt || null);
            console.log('✅ Loaded picks from localStorage fallback (including historical)');
          } catch (e) {
            console.error('❌ Failed to parse localStorage data:', e);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserPicks();
  }, [gameId, homeTeamId, awayTeamId]);

  // Calculate time-filtered scores for user picks (same logic as YourPicks)
  useEffect(() => {
    if (userPickIds.size === 0 || playLog.length === 0) {
      setUserPickScores({});
      return;
    }

    console.log('🔄 TopPicks: Calculating time-filtered user scores...');
    
    // If no lock data available, can't calculate time-filtered scores
    if (!globalLockedAt && Object.keys(playerLockTimes).length === 0 && Object.keys(playerHistory).length === 0) {
      console.warn('⚠️ TopPicks: No lock time data available from API or localStorage');
      setUserPickScores({});
      return;
    }

    console.log('💾 TopPicks: Using lock data - Player lock times:', playerLockTimes);
    console.log('💾 TopPicks: Global locked at:', globalLockedAt);
    console.log('💾 TopPicks: Player history:', playerHistory);

    const scores: Record<string, number> = {};
    
    // Helper to convert any timestamp format to milliseconds
    const toMs = (ts: any): number => {
      if (!ts) return 0;
      if (typeof ts === 'number') return ts;
      if (ts._seconds) return ts._seconds * 1000;
      if (ts instanceof Date) return ts.getTime();
      return new Date(ts).getTime();
    };
    
    // Calculate score for each user pick
    Array.from(userPickIds).forEach(playerId => {
      scores[playerId] = 0;
      
      // Get lock times for this player
      let lockTimesMs: Array<{ start: number; end?: number }> = [];
      
      // Add from playerHistory
      if (playerHistory[playerId]) {
        lockTimesMs = playerHistory[playerId].map(p => ({
          start: toMs(p.start),
          end: p.end ? toMs(p.end) : undefined
        }));
      }
      
      // Add current lock time if exists
      if (playerLockTimes[playerId]) {
        lockTimesMs.push({ start: toMs(playerLockTimes[playerId]) });
      }
      
      // Fallback to global lock time
      if (lockTimesMs.length === 0 && globalLockedAt) {
        lockTimesMs = [{ start: toMs(globalLockedAt) }];
      }
      
      if (lockTimesMs.length === 0) {
        console.warn(`⚠️ No lock time for player ${playerId}`);
        return;
      }
      
      // Count plays that happened AFTER the player was locked
      let totalPlaysForPlayer = 0;
      let playsAfterLock = 0;
      
      playLog.forEach(play => {
        if (!play.athletesInvolved || play.athletesInvolved.length === 0) return;
        
        const isInvolved = play.athletesInvolved.some(a => a.id === playerId);
        if (!isInvolved) return;
        
        totalPlaysForPlayer++;
        const playTime = toMs(play.timestamp);
        
        // Debug first play for this player
        if (totalPlaysForPlayer === 1) {
          console.log(`  First play for ${playerId}: ${new Date(playTime).toISOString()}, Lock times:`, lockTimesMs.map(p => ({
            start: new Date(p.start).toISOString(),
            end: p.end ? new Date(p.end).toISOString() : 'ongoing'
          })));
        }
        
        // Check if play is within any active period (after lock start, before lock end if exists)
        const isInActivePeriod = lockTimesMs.some(period => {
          const afterStart = playTime >= period.start;
          const beforeEnd = !period.end || playTime <= period.end;
          return afterStart && beforeEnd;
        });
        
        if (isInActivePeriod) {
          scores[playerId]++;
          playsAfterLock++;
        }
      });
      
      if (totalPlaysForPlayer > 0) {
        console.log(`  Player ${playerId}: ${playsAfterLock}/${totalPlaysForPlayer} plays after lock`);
      }
      
      console.log(`✅ TopPicks: Player ${playerId} time-filtered score: ${scores[playerId]}`);
    });

    setUserPickScores(scores);
  }, [userPickIds, playLog, playerHistory, playerLockTimes, globalLockedAt]);

  // Calculate top picks from play log
  const topPicks = useMemo(() => {
    console.log('🔄 Recalculating top picks...');
    console.log('📊 User pick IDs:', Array.from(userPickIds));
    console.log('📝 Total plays in log:', playLog.length);

    // Check if plays have athlete data
    const playsWithAthletes = playLog.filter(p => p.athletesInvolved && p.athletesInvolved.length > 0).length;
    console.log('📊 Plays with athlete data:', playsWithAthletes);
    
    // If less than 10% of plays have athlete data, the data is incomplete
    if (playLog.length > 0 && playsWithAthletes < playLog.length * 0.1) {
      console.warn('⚠️ Insufficient athlete data in plays. TopPicks will not be accurate.');
      console.warn('   This game needs to be re-fetched from ESPN to populate athlete information.');
    }

    // Build a map of all athletes who have scored
    const athleteScores = new Map<string, PlayerScore>();

    playLog.forEach((play) => {
      // Count all plays where athletes are involved (no scoreValue filter)
      if (play.athletesInvolved && play.athletesInvolved.length > 0) {
        play.athletesInvolved.forEach((athlete) => {
          if (!athleteScores.has(athlete.id)) {
            const isCurrentPick = currentPickIds.has(athlete.id);
            const hasScore = userPickIds.has(athlete.id);
            if (hasScore) {
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
              isUserPick: hasScore,
              isCurrentPick: isCurrentPick,
            });
          }
          // Increment score by 1 for each play involvement
          const current = athleteScores.get(athlete.id)!;
          current.score += 1;
        });
      } else {
        // Fallback: Extract player names from play text
        const playText = play.text || '';
        
        // Try to extract player name (format: "I.Pacheco" or "P.Mahomes")
        const nameMatch = playText.match(/^(?:\([\w\s]+\)\s*)?([A-Z]\.[A-Z][a-z]+)/);
        if (nameMatch) {
          const playerName = nameMatch[1]; // e.g., "P.Mahomes"
          const playerId = playerName; // Use name as ID since we don't have actual ID
          
          if (!athleteScores.has(playerId)) {
            athleteScores.set(playerId, {
              id: playerId,
              fullName: playerName,
              displayName: playerName,
              shortName: playerName,
              headshot: '',
              jersey: '',
              position: '',
              teamId: (play as any).team || '',
              score: 0,
              isUserPick: false,
              isCurrentPick: false,
            });
          }
          const current = athleteScores.get(playerId)!;
          current.score += 1;
        }
      }
    });

    // Convert to array and sort by score descending
    const sorted = Array.from(athleteScores.values())
      .sort((a, b) => b.score - a.score);
    
    const userPicks = sorted.filter(p => p.isUserPick);
    console.log(`✅ Total players with scores: ${sorted.length}, User picks: ${userPicks.length}`);
    
    return sorted;
  }, [playLog, userPickIds, currentPickIds]);

  // Calculate total user score from the topPicks data (not time-filtered)
  const userTotalScore = topPicks
    .filter(p => p.isUserPick)
    .reduce((sum, player) => sum + player.score, 0);

  const displayedPicks = isExpanded ? topPicks : topPicks.slice(0, 5);
  const hasMore = topPicks.length > 5;

  return (
    <div className="space-y-4 p">
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
          {/* Header Row - Show when user has any picks */}
          {userPickIds.size > 0 && (
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
                    ${player.isCurrentPick
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
                      <div className={player.isCurrentPick ? 'relative' : ''}>
                        {player.isCurrentPick && (
                          <div className="absolute inset-0 rounded-full bg-[#00ffe7] blur-md opacity-50 animate-pulse"></div>
                        )}
                        {player.headshot ? (
                          <img
                            src={player.headshot}
                            alt={player.displayName}
                            className={`
                              relative w-14 h-14 rounded-full border-2 object-cover
                              ${player.isCurrentPick ? 'border-[#00ffe7]' : 'border-[#00ffe7]/30'}
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
                            relative w-14 h-14 rounded-full border-2 bg-[#23263a] items-center justify-center
                            ${player.isCurrentPick ? 'border-[#00ffe7]' : 'border-[#00ffe7]/30'}
                          `}
                          style={{ display: player.headshot ? 'none' : 'flex' }}
                        >
                          <span className="text-xs font-bold text-[#00ffe7]">{player.shortName?.substring(0, 2) || 'P'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className={`font-bold text-base truncate ${player.isCurrentPick ? 'text-[#00ffe7] drop-shadow-[0_0_8px_rgba(0,255,231,0.8)]' : 'text-white'}`}>
                          {player.shortName || player.displayName}
                        </h4>

                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={player.isCurrentPick ? 'text-[#00ffe7]/80' : 'text-[#b0b7bf]'}>
                          {player.position} • #{player.jersey}
                        </span>
                        <div className="flex items-center gap-1">
                          <img
                            src={getTeamLogo(team)}
                            alt=""
                            className="w-3 h-3"
                          />
                          <span className={`text-[10px] ${player.isCurrentPick ? 'text-[#00ffe7]/80' : 'text-[#b0b7bf]'}`}>
                            {team?.team?.abbreviation}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Score */}
                    <div className="flex-shrink-0 text-right pr-3">
                      {player.isUserPick ? (
                        // For user picks, show both their score and total score
                        <div className="flex items-center" style={{ gap: '12px' }}>
                          <div className="text-2xl font-bold text-[#00ffe7] drop-shadow-[0_0_10px_rgba(0,255,231,0.8)] text-center" style={{ width: '80px' }}>
                            {userPickScores[player.id] || player.score}
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

          {/* Expand Button */}
          {hasMore && (
            <div className="border-t border-[#00ffe7]/20 p-2">
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
