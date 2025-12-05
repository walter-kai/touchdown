import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUsers, FaLock, FaUnlock, FaClock, FaCheckCircle, FaFootballBall, FaTimes, FaArrowRight } from 'react-icons/fa';

interface Athlete {
  id: string;
  displayName: string;
  shortName: string;
  position: {
    abbreviation: string;
  };
  headshot?: {
    href: string;
  } | string; // Can be object from API or string from localStorage
  jersey?: string;
  team?: {
    id: string;
    logo: string;
  };
}

interface PlayerPickProps {
  homeTeamId: string;
  awayTeamId: string;
  homeTeamInfo: {
    name: string;
    logo: string;
    color: string;
  };
  awayTeamInfo: {
    name: string;
    logo: string;
    color: string;
  };
  isExpanded: boolean;
  onToggle: () => void;
  playLog: Array<{
    athletesInvolved?: Array<{
      id: string;
    }>;
  }>;
}

const PlayerPick: React.FC<PlayerPickProps> = ({
  homeTeamId,
  awayTeamId,
  homeTeamInfo,
  awayTeamInfo,
  isExpanded,
  onToggle,
  playLog
}) => {
  const [homeRoster, setHomeRoster] = useState<Athlete[]>([]);
  const [awayRoster, setAwayRoster] = useState<Athlete[]>([]);
  const [homeTeamLogo, setHomeTeamLogo] = useState<string>('');
  const [awayTeamLogo, setAwayTeamLogo] = useState<string>('');
  const [selectedPlayers, setSelectedPlayers] = useState<Athlete[]>([]);
  const [newPicks, setNewPicks] = useState<Athlete[]>([]); // New picks being selected
  const [isLocked, setIsLocked] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home');
  const [currentSetScores, setCurrentSetScores] = useState<Record<string, number>>({});
  const [totalScore, setTotalScore] = useState(0);

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`playerPick_${homeTeamId}_${awayTeamId}`);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      
      // Always restore selections and total score
      if (parsed.players && parsed.players.length > 0) {
        setSelectedPlayers(parsed.players);
        setTotalScore(parsed.totalScore || 0);
      }
      
      // Check if still in cooldown period
      if (parsed.lockedAt) {
        const elapsed = Date.now() - parsed.lockedAt;
        const remaining = 120000 - elapsed; // 2 minutes in ms
        if (remaining > 0) {
          setIsLocked(true);
          setCooldownTime(Math.ceil(remaining / 1000));
        } else {
          // Cooldown expired but keep selections
          setIsLocked(false);
        }
      }
    }
  }, [homeTeamId, awayTeamId]);

  // Calculate scores for current set based on playLog
  useEffect(() => {
    if (selectedPlayers.length === 0 || !isLocked) {
      setCurrentSetScores({});
      return;
    }

    const scores: Record<string, number> = {};
    selectedPlayers.forEach(player => {
      scores[player.id] = 0;
    });

    playLog.forEach(play => {
      if (play.athletesInvolved) {
        play.athletesInvolved.forEach(athlete => {
          if (scores.hasOwnProperty(athlete.id)) {
            scores[athlete.id]++;
          }
        });
      }
    });

    setCurrentSetScores(scores);
  }, [playLog, selectedPlayers, isLocked]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            // Just unlock - keep selections and accumulated scores
            setIsLocked(false);
            // Update localStorage to remove lock timestamp but keep selections
            const savedState = localStorage.getItem(`playerPick_${homeTeamId}_${awayTeamId}`);
            if (savedState) {
              const parsed = JSON.parse(savedState);
              const newState = {
                players: parsed.players,
                totalScore: totalScore + Object.values(currentSetScores).reduce((sum, score) => sum + score, 0),
                lockedAt: null
              };
              localStorage.setItem(`playerPick_${homeTeamId}_${awayTeamId}`, JSON.stringify(newState));
              setTotalScore(newState.totalScore);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownTime, homeTeamId, awayTeamId, currentSetScores, totalScore]);

  // Fetch rosters
  useEffect(() => {
    const fetchRoster = async (
      teamId: string, 
      rosterSetter: React.Dispatch<React.SetStateAction<Athlete[]>>,
      logoSetter: React.Dispatch<React.SetStateAction<string>>
    ) => {
      try {
        const response = await axios.get(
          `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}?enable=roster`
        );
        const athletes = response.data.team.athletes || [];
        rosterSetter(athletes);
        
        // Extract logo from team data
        const logos = response.data.team.logos;
        if (logos && logos.length > 0) {
          logoSetter(logos[0].href);
        }
      } catch (err) {
        console.error(`Error fetching roster for team ${teamId}:`, err);
      }
    };

    Promise.all([
      fetchRoster(homeTeamId, setHomeRoster, setHomeTeamLogo),
      fetchRoster(awayTeamId, setAwayRoster, setAwayTeamLogo)
    ]).finally(() => setLoading(false));
  }, [homeTeamId, awayTeamId]);

  const handlePlayerSelect = (player: Athlete) => {
    if (isLocked) return;

    // Normalize headshot to string URL for storage and add team info
    const isHome = homeRoster.some(p => p.id === player.id);
    const normalizedPlayer = {
      ...player,
      headshot: typeof player.headshot === 'object' && player.headshot?.href 
        ? player.headshot.href 
        : player.headshot,
      team: {
        id: isHome ? homeTeamId : awayTeamId,
        logo: isHome ? homeTeamLogo : awayTeamLogo
      }
    };

    const isInNew = newPicks.some((p) => p.id === player.id);
    let updatedNewPicks;
    
    if (isInNew) {
      // Deselect from new picks
      updatedNewPicks = newPicks.filter((p) => p.id !== player.id);
    } else if (newPicks.length < 3) {
      // Add to new picks
      updatedNewPicks = [...newPicks, normalizedPlayer];
    } else {
      // Replace oldest pick
      updatedNewPicks = [...newPicks.slice(1), normalizedPlayer];
    }
    
    setNewPicks(updatedNewPicks);
  };

  const handleLockIn = () => {
    if (newPicks.length === 3) {
      // Normalize all headshots to strings before saving
      const normalizedPicks = newPicks.map(player => ({
        ...player,
        headshot: typeof player.headshot === 'object' && player.headshot?.href
          ? player.headshot.href
          : player.headshot
      }));
      
      setSelectedPlayers(normalizedPicks);
      setNewPicks([]);
      setIsLocked(true);
      setCooldownTime(120); // 2 minutes
      setCurrentSetScores({}); // Reset current set scores
      const state = {
        players: normalizedPicks,
        lockedAt: Date.now(),
        totalScore: totalScore
      };
      localStorage.setItem(`playerPick_${homeTeamId}_${awayTeamId}`, JSON.stringify(state));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentRoster = activeTeam === 'home' ? homeRoster : awayRoster;
  const currentTeamInfo = activeTeam === 'home' ? homeTeamInfo : awayTeamInfo;
  const currentTeamLogo = activeTeam === 'home' ? homeTeamLogo : awayTeamLogo;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#00ffe7] text-lg">Loading players...</div>
      </div>
    );
  }

  return (
    <div>


      {/* Content */}
      <div className="px-6">
        {/* Minimalistic Score List - Vertical table format */}
        {!isLocked && selectedPlayers.length > 0 && (
          <div className="bg-[#181a23]/50 rounded-lg p-3 mb-4 border border-[#00ffe7]/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#00ffe7] text-xs font-bold">SELECTED PICKS</span>
              <span className="text-[#b0b7bf] text-[10px]">Total: {totalScore} pts</span>
            </div>
            <div className="space-y-1">
              {selectedPlayers.map((player, idx) => {
                const headshotUrl = typeof player.headshot === 'string' ? player.headshot : player.headshot?.href;
                // Find team info
                const isHome = homeRoster.some(p => p.id === player.id);
                const teamLogo = isHome ? homeTeamLogo : awayTeamLogo;
                
                return (
                  <div key={player.id} className="flex items-center gap-2 bg-black/30 rounded p-1.5">
                    <div className="w-4 h-4 rounded-full bg-[#00ffe7] text-black text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </div>
                    {headshotUrl && (
                      <img
                        src={headshotUrl}
                        alt={player.displayName}
                        className="w-6 h-6 rounded-full border border-[#00ffe7]/50 flex-shrink-0"
                      />
                    )}
                    {teamLogo && (
                      <img src={teamLogo} alt="" className="w-4 h-4 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-white text-[10px] font-bold truncate block">{player.shortName}</span>
                    </div>
                    <div className="text-[#b0b7bf] text-[9px] w-8 text-center flex-shrink-0">
                      {player.position.abbreviation}
                    </div>
                    <div className="text-[#00ffe7] text-[10px] font-bold w-10 text-right flex-shrink-0">
                      {currentSetScores[player.id] || 0} pts
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Selected Players Display - Always show when locked, otherwise only when expanded */}
        {isLocked && (
          <div className="bg-gradient-to-r from-[#00ffe7]/10 to-[#faafe8]/10 rounded-lg p-6 border border-[#00ffe7]/30 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                  <FaLock className="text-green-500 text-sm" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">Your Picks (Locked)</h4>
                  <div className="text-sm text-gray-400">Total Score: <span className="text-[#00ffe7] font-bold">{totalScore + Object.values(currentSetScores).reduce((sum, score) => sum + score, 0)}</span></div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-yellow-400">
                <FaClock />
                <span className="text-sm font-mono">{formatTime(cooldownTime)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedPlayers.map((player, idx) => {
                const headshotUrl = typeof player.headshot === 'string' ? player.headshot : player.headshot?.href;
                return (
                  <div
                    key={player.id}
                    className="bg-[#181a23]/90 rounded-lg p-4 border border-[#00ffe7]/30 relative"
                  >
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#00ffe7] text-black font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </div>
                    <div className="flex items-center gap-3">
                      {headshotUrl ? (
                        <img
                          src={headshotUrl}
                          alt={player.displayName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#00ffe7]/50"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-12 h-12 rounded-full bg-[#23263a] border-2 border-[#00ffe7]/50 flex items-center justify-center flex-shrink-0"
                        style={{ display: headshotUrl ? 'none' : 'flex' }}
                      >
                      <FaUsers className="text-[#00ffe7]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-sm truncate">{player.shortName}</div>
                      <div className="text-[#00ffe7] text-xs">
                        {player.position.abbreviation} {player.jersey && `#${player.jersey}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#00ffe7]">{currentSetScores[player.id] || 0}</div>
                      <div className="text-xs text-gray-400">pts</div>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        )}

        {/* Selection Interface - Only show when expanded */}
        {isExpanded && !isLocked && (
          <div className="space-y-6">
            {/* Current vs New Picks Display */}
            <div className="bg-gradient-to-r from-[#00ffe7]/10 to-[#faafe8]/10 rounded-lg p-6 border border-[#00ffe7]/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                  <FaUnlock className="text-red-500 text-sm" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">Your Picks ({newPicks.length}/3)</h4>
                </div>
              </div>

              {selectedPlayers.length > 0 || newPicks.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {/* Current Picks Column */}
                  <div>
                    <div className="text-[#b0b7bf] text-xs mb-2 font-bold">CURRENT</div>
                    <div className="space-y-2">
                      {selectedPlayers.length > 0 ? selectedPlayers.map((player, idx) => {
                        const headshotUrl = typeof player.headshot === 'string' ? player.headshot : player.headshot?.href;
                        return (
                          <div
                            key={player.id}
                            className="bg-[#181a23]/90 rounded-lg p-3 border border-[#00ffe7]/30 flex items-center gap-2"
                          >
                            <div className="w-5 h-5 rounded-full bg-[#00ffe7] text-black font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {idx + 1}
                            </div>
                            {headshotUrl ? (
                              <img
                                src={headshotUrl}
                                alt={player.displayName}
                                className="w-10 h-10 rounded-full object-cover border-2 border-[#00ffe7]/50"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="w-10 h-10 rounded-full bg-[#23263a] border-2 border-[#00ffe7]/50 flex items-center justify-center flex-shrink-0"
                              style={{ display: headshotUrl ? 'none' : 'flex' }}
                            >
                              <FaUsers className="text-[#00ffe7] text-sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-bold text-xs truncate">{player.shortName}</div>
                              <div className="text-[#00ffe7] text-[10px]">{player.position.abbreviation}</div>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="bg-[#181a23]/50 rounded-lg p-8 border border-dashed border-[#00ffe7]/20 text-center">
                          <p className="text-gray-500 text-xs">No picks yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  {selectedPlayers.length > 0 && newPicks.length > 0 && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                      <FaArrowRight className="text-[#00ffe7] text-2xl" />
                    </div>
                  )}

                  {/* New Picks Column */}
                  <div className="relative">
                    <div className="text-[#faafe8] text-xs mb-2 font-bold">NEW</div>
                    <div className="space-y-2">
                      {newPicks.length > 0 ? newPicks.map((player, idx) => {
                        const headshotUrl = typeof player.headshot === 'string' ? player.headshot : player.headshot?.href;
                        return (
                          <div
                            key={player.id}
                            className="bg-[#181a23]/90 rounded-lg p-3 border border-[#faafe8]/30 flex items-center gap-2"
                          >
                            <div className="w-5 h-5 rounded-full bg-[#faafe8] text-black font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {idx + 1}
                            </div>
                            {headshotUrl ? (
                              <img
                                src={headshotUrl}
                                alt={player.displayName}
                                className="w-10 h-10 rounded-full object-cover border-2 border-[#faafe8]/50"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="w-10 h-10 rounded-full bg-[#23263a] border-2 border-[#faafe8]/50 flex items-center justify-center flex-shrink-0"
                              style={{ display: headshotUrl ? 'none' : 'flex' }}
                            >
                              <FaUsers className="text-[#faafe8] text-sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-bold text-xs truncate">{player.shortName}</div>
                              <div className="text-[#faafe8] text-[10px]">{player.position.abbreviation}</div>
                            </div>
                          </div>
                        );
                      }) : (
                        [...Array(3)].map((_, idx) => (
                          <div
                            key={`empty-${idx}`}
                            className="bg-[#181a23]/50 rounded-lg p-3 border border-dashed border-[#faafe8]/20 flex items-center justify-center h-[58px]"
                          >
                            <span className="text-gray-500 text-xs">Pick {idx + 1}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#181a23]/50 rounded-lg p-8 border border-dashed border-[#00ffe7]/20 text-center mb-4">
                  <FaUsers className="text-gray-500 text-4xl mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Select 3 players to continue</p>
                </div>
              )}

              {/* Lock In Button */}
              <button
                onClick={handleLockIn}
                disabled={newPicks.length !== 3}
                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all mt-4 ${
                  newPicks.length === 3
                    ? 'bg-[#00ffe7]/20 border-2 border-[#00ffe7] text-[#00ffe7] hover:bg-[#00ffe7]/30 cursor-pointer'
                    : 'bg-gray-700/20 border-2 border-gray-600 text-gray-500 cursor-not-allowed'
                }`}
              >
                <FaUnlock />
                Lock In Selection
              </button>
            </div>

            {/* Team Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTeam('home')}
                className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTeam === 'home'
                    ? 'bg-[#faafe8]/20 border-2 border-[#faafe8] text-[#faafe8]'
                    : 'bg-[#181a23] border-2 border-[#faafe8]/30 text-gray-400 hover:border-[#faafe8]/50'
                }`}
              >
                {homeTeamLogo && <img src={homeTeamLogo} alt="" className="w-6 h-6" />}
                {homeTeamInfo.name}
              </button>
              <button
                onClick={() => setActiveTeam('away')}
                className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTeam === 'away'
                    ? 'bg-[#00ffe7]/20 border-2 border-[#00ffe7] text-[#00ffe7]'
                    : 'bg-[#181a23] border-2 border-[#00ffe7]/30 text-gray-400 hover:border-[#00ffe7]/50'
                }`}
              >
                {awayTeamLogo && <img src={awayTeamLogo} alt="" className="w-6 h-6" />}
                {awayTeamInfo.name}
              </button>
            </div>

            {/* Player List */}
            <div className="bg-[#181a23]/90 rounded-lg border border-[#00ffe7]/30 p-4 max-h-[500px] overflow-y-auto">
              <h4 className="text-[#00ffe7] font-bold mb-4 sticky top-0 bg-[#181a23] pb-2 flex items-center gap-2">
                {currentTeamLogo && <img src={currentTeamLogo} alt="" className="w-6 h-6" />}
                {currentTeamInfo.name} Roster
              </h4>
              <div className="space-y-2">
                {currentRoster.map((player) => {
                  const isSelected = newPicks.some((p) => p.id === player.id);
                  const headshotUrl = typeof player.headshot === 'string' ? player.headshot : player.headshot?.href;
                  return (
                    <button
                      key={player.id}
                      onClick={() => handlePlayerSelect(player)}
                      className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                        isSelected
                          ? 'bg-[#00ffe7]/20 border-2 border-[#00ffe7]'
                          : 'bg-[#23263a]/50 border-2 border-transparent hover:border-[#00ffe7]/30'
                      } cursor-pointer`}
                    >
                      {headshotUrl ? (
                        <img
                          src={headshotUrl}
                          alt={player.displayName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#00ffe7]/50"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-10 h-10 rounded-full bg-[#23263a] border-2 border-[#00ffe7]/50 flex items-center justify-center flex-shrink-0"
                        style={{ display: headshotUrl ? 'none' : 'flex' }}
                      >
                        <FaUsers className="text-[#00ffe7] text-sm" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className={`font-bold text-sm truncate ${isSelected ? 'text-[#00ffe7]' : 'text-white'}`}>
                          {player.displayName}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {player.position.abbreviation} {player.jersey && `• #${player.jersey}`}
                        </div>
                      </div>
                      {isSelected && <FaCheckCircle className="text-[#00ffe7] flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerPick;
