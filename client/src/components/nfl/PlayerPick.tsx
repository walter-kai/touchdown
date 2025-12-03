import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUsers, FaLock, FaUnlock, FaClock, FaCheckCircle, FaFootballBall, FaTimes } from 'react-icons/fa';

interface Athlete {
  id: string;
  displayName: string;
  shortName: string;
  position: {
    abbreviation: string;
  };
  headshot?: {
    href: string;
  };
  jersey?: string;
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
      if (parsed.lockedAt) {
        const elapsed = Date.now() - parsed.lockedAt;
        const remaining = 120000 - elapsed; // 2 minutes in ms
        if (remaining > 0) {
          setSelectedPlayers(parsed.players);
          setIsLocked(true);
          setCooldownTime(Math.ceil(remaining / 1000));
          setTotalScore(parsed.totalScore || 0);
        } else {
          localStorage.removeItem(`playerPick_${homeTeamId}_${awayTeamId}`);
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
            // Accumulate scores to total before unlocking
            const setTotal = Object.values(currentSetScores).reduce((sum, score) => sum + score, 0);
            setTotalScore(prevTotal => prevTotal + setTotal);
            setIsLocked(false);
            setSelectedPlayers([]);
            setCurrentSetScores({});
            localStorage.removeItem(`playerPick_${homeTeamId}_${awayTeamId}`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownTime, homeTeamId, awayTeamId, currentSetScores]);

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

    const isSelected = selectedPlayers.some((p) => p.id === player.id);
    if (isSelected) {
      setSelectedPlayers(selectedPlayers.filter((p) => p.id !== player.id));
    } else if (selectedPlayers.length < 3) {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const handleLockIn = () => {
    if (selectedPlayers.length === 3) {
      setIsLocked(true);
      setCooldownTime(120); // 2 minutes
      setCurrentSetScores({}); // Reset current set scores
      const state = {
        players: selectedPlayers,
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
      {/* Header Button */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#faafe8]/5 transition-colors"
      >
        <h3 className="text-[#faafe8] font-bold text-xl flex items-center gap-2">
          <FaFootballBall />
          Player Pick
        </h3>
        <span className={`text-[#faafe8] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Content */}
      <div className="pb-6 px-6">
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
              {selectedPlayers.map((player, idx) => (
                <div
                  key={player.id}
                  className="bg-[#181a23]/90 rounded-lg p-4 border border-[#00ffe7]/30 relative"
                >
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#00ffe7] text-black font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div className="flex items-center gap-3">
                    {player.headshot?.href ? (
                      <img
                        src={player.headshot.href}
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
                      style={{ display: player.headshot?.href ? 'none' : 'flex' }}
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
              ))}
            </div>
          </div>
        )}

        {/* Selection Interface - Only show when expanded */}
        {isExpanded && !isLocked && (
          <div className="space-y-6">
            {/* Selected Players Display */}
            <div className="bg-gradient-to-r from-[#00ffe7]/10 to-[#faafe8]/10 rounded-lg p-6 border border-[#00ffe7]/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                    <FaUnlock className="text-red-500 text-sm" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">Your Picks ({selectedPlayers.length}/3)</h4>
                    <div className="text-sm text-gray-400">Total Score: <span className="text-[#00ffe7] font-bold">{totalScore}</span></div>
                  </div>
                </div>
              </div>

              {selectedPlayers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {selectedPlayers.map((player, idx) => (
                    <div
                      key={player.id}
                      className="bg-[#181a23]/90 rounded-lg p-4 border border-[#00ffe7]/30 relative"
                    >
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#00ffe7] text-black font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <div className="flex items-center gap-3">
                        {player.headshot?.href ? (
                          <img
                            src={player.headshot.href}
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
                          style={{ display: player.headshot?.href ? 'none' : 'flex' }}
                        >
                          <FaUsers className="text-[#00ffe7]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-bold text-sm truncate">{player.shortName}</div>
                          <div className="text-[#00ffe7] text-xs">
                            {player.position.abbreviation} {player.jersey && `#${player.jersey}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Empty slots */}
                  {[...Array(3 - selectedPlayers.length)].map((_, idx) => (
                    <div
                      key={`empty-${idx}`}
                      className="bg-[#181a23]/50 rounded-lg p-4 border border-dashed border-[#00ffe7]/20 flex items-center justify-center"
                    >
                      <span className="text-gray-500 text-sm">Select a player</span>
                    </div>
                  ))}
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
                disabled={selectedPlayers.length !== 3}
                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  selectedPlayers.length === 3
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
                  const isSelected = selectedPlayers.some((p) => p.id === player.id);
                  return (
                    <button
                      key={player.id}
                      onClick={() => handlePlayerSelect(player)}
                      disabled={!isSelected && selectedPlayers.length >= 3}
                      className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                        isSelected
                          ? 'bg-[#00ffe7]/20 border-2 border-[#00ffe7]'
                          : 'bg-[#23263a]/50 border-2 border-transparent hover:border-[#00ffe7]/30'
                      } ${
                        !isSelected && selectedPlayers.length >= 3
                          ? 'opacity-50 cursor-not-allowed'
                          : 'cursor-pointer'
                      }`}
                    >
                      {player.headshot?.href ? (
                        <img
                          src={player.headshot.href}
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
                        style={{ display: player.headshot?.href ? 'none' : 'flex' }}
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
