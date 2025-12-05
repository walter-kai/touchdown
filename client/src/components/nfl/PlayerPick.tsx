import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUsers, FaLock, FaUnlock, FaClock, FaCheckCircle, FaFootballBall, FaTimes, FaArrowRight, FaPlus } from 'react-icons/fa';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend, getEmptyImage } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { MultiBackend, TouchTransition, MouseTransition } from 'react-dnd-multi-backend';
import { usePreview } from 'react-dnd-preview';

// Multi-backend configuration for both desktop and mobile
const HTML5toTouch = {
  backends: [
    {
      id: 'html5',
      backend: HTML5Backend,
      transition: MouseTransition,
    },
    {
      id: 'touch',
      backend: TouchBackend,
      options: { enableMouseEvents: true },
      preview: true,
      transition: TouchTransition,
    },
  ],
};

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

const ItemTypes = {
  PLAYER: 'player',
};

interface DraggablePlayerCardProps {
  player: Athlete;
  index: number;
  movePlayer: (dragIndex: number, hoverIndex: number) => void;
  isAnimating?: boolean;
}

const DraggablePlayerCard: React.FC<DraggablePlayerCardProps> = ({ player, index, movePlayer, isAnimating }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.PLAYER,
    item: { index, player },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.PLAYER,
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        movePlayer(item.index, index);
        item.index = index;
      }
    },
  });

  const headshotUrl = typeof player.headshot === 'string' ? player.headshot : player.headshot?.href;

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`bg-[#181a23]/90 rounded-lg p-4 border border-[#faafe8]/30 flex items-center gap-4 h-[72px] transition-all duration-1000 ${
        isDragging ? 'opacity-30' : isAnimating ? 'opacity-100' : 'hover:scale-105 hover:border-[#faafe8]/60'
      }`}
      style={{ 
        ...(isAnimating && { 
          animation: `slideToLeft 1000ms ease-out forwards`,
          animationDelay: `${index * 80}ms`
        })
      }}
    >
      <div className="w-6 h-6 rounded-full bg-[#faafe8] text-black font-bold text-xs flex items-center justify-center flex-shrink-0">
        {index + 1}
      </div>
      {headshotUrl ? (
        <img
          src={headshotUrl}
          alt={player.displayName}
          className="w-12 h-12 rounded-full object-cover border-2 border-[#faafe8]/50 flex-shrink-0"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : null}
      <div 
        className="w-12 h-12 rounded-full bg-[#23263a] border-2 border-[#faafe8]/50 flex items-center justify-center flex-shrink-0"
        style={{ display: headshotUrl ? 'none' : 'flex' }}
      >
        <FaUsers className="text-[#faafe8] text-sm" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-bold text-sm truncate">{player.shortName}</div>
        <div className="text-[#faafe8] text-xs">{player.position.abbreviation}{player.jersey && ` • #${player.jersey}`}</div>
      </div>
    </div>
  );
};

interface EmptySlotProps {
  index: number;
  movePlayer: (dragIndex: number, hoverIndex: number) => void;
}

const EmptySlot: React.FC<EmptySlotProps> = ({ index, movePlayer }) => {
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.PLAYER,
    drop: (item: { index: number }) => {
      movePlayer(item.index, index);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`bg-[#181a23]/50 rounded-lg p-4 border border-dashed flex items-center gap-4 h-[72px] transition-all duration-200 ${
        isOver ? 'border-[#faafe8] bg-[#faafe8]/20 scale-105 shadow-lg shadow-[#faafe8]/30' : 'border-[#faafe8]/20'
      }`}
    >
      <div className={`w-6 h-6 rounded-full text-white font-bold text-xs flex items-center justify-center flex-shrink-0 transition-colors ${
        isOver ? 'bg-[#faafe8]' : 'bg-[#faafe8]/30'
      }`}>
        {index + 1}
      </div>
      <div className={`w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center flex-shrink-0 transition-all ${
        isOver ? 'bg-[#faafe8]/30 border-[#faafe8]' : 'bg-[#23263a]/50 border-[#faafe8]/20'
      }`}>
        <FaPlus className={`text-sm transition-colors ${
          isOver ? 'text-[#faafe8]' : 'text-[#faafe8]/40'
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-sm transition-colors ${
          isOver ? 'text-[#faafe8]' : 'text-[#faafe8]/40'
        }`}>Drag here</span>
      </div>
    </div>
  );
};

// Custom drag preview component
const MyPreview = () => {
  const preview = usePreview<{ player: Athlete; index: number }>();
  if (!preview.display) {
    return null;
  }
  
  const { item, style } = preview;
  const headshotUrl = typeof item.player.headshot === 'string' ? item.player.headshot : item.player.headshot?.href;
  
  return (
    <div 
      style={{
        ...style,
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 100,
        left: style.x,
        top: style.y,
        transform: 'translate(-50%, -50%)',
      }} 
      className="cursor-grabbing"
    >
      <div className="bg-[#181a23] rounded-lg p-3 border-2 border-[#faafe8] flex items-center gap-2 shadow-2xl shadow-[#faafe8]/50" style={{ minHeight: '58px', minWidth: '200px' }}>
        <div className="w-5 h-5 rounded-full bg-[#faafe8] text-black font-bold text-xs flex items-center justify-center flex-shrink-0">
          {item.index + 1}
        </div>
        {headshotUrl ? (
          <img
            src={headshotUrl}
            alt={item.player.displayName}
            className="w-10 h-10 rounded-full object-cover border-2 border-[#faafe8]/50 flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#23263a] border-2 border-[#faafe8]/50 flex items-center justify-center flex-shrink-0">
            <FaUsers className="text-[#faafe8] text-sm" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-xs truncate">{item.player.shortName}</div>
          <div className="text-[#faafe8] text-[10px]">{item.player.position.abbreviation}</div>
        </div>
      </div>
    </div>
  );
};

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
  const [isAnimating, setIsAnimating] = useState(false);
  const [showStats, setShowStats] = useState(false);

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
        const remaining = 5000 - elapsed; // 5 seconds in ms
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

    console.log('Raw player object:', player);
    console.log('Player headshot type:', typeof player.headshot);
    console.log('Player headshot value:', player.headshot);

    // Get the actual headshot URL - ESPN API provides it in player.headshot.href
    const isHome = homeRoster.some(p => p.id === player.id);
    let headshotUrl: string | undefined = undefined;
    
    // Check if headshot exists and extract the URL
    if (player.headshot) {
      if (typeof player.headshot === 'object' && 'href' in player.headshot) {
        headshotUrl = player.headshot.href;
        console.log('Extracted from object:', headshotUrl);
      } else if (typeof player.headshot === 'string') {
        headshotUrl = player.headshot;
        console.log('Already string:', headshotUrl);
      }
    }
    
    console.log('Final headshot URL to save:', headshotUrl);
    
    const normalizedPlayer: any = {
      id: player.id,
      displayName: player.displayName,
      shortName: player.shortName,
      position: {
        abbreviation: player.position.abbreviation
      },
      jersey: player.jersey,
      headshot: headshotUrl, // This is now guaranteed to be a string URL or undefined
      team: {
        id: isHome ? homeTeamId : awayTeamId,
        logo: isHome ? homeTeamLogo : awayTeamLogo
      }
    };

    console.log('Normalized player to add:', normalizedPlayer);

    // Check if player is already in current picks or new picks
    const isInCurrent = selectedPlayers.some((p) => p.id === player.id);
    const isInNew = newPicks.filter(p => p).some((p) => p.id === player.id);
    
    // Prevent duplicates - don't allow selection if already in either current or new
    if (isInCurrent && !isInNew) {
      return; // Player already in current picks, can't select
    }
    
    let updatedNewPicks;
    
    if (isInNew) {
      // Deselect from new picks
      updatedNewPicks = newPicks.filter((p) => p && p.id !== player.id);
    } else if (newPicks.filter(p => p).length < 5) {
      // Add to new picks
      updatedNewPicks = [...newPicks, normalizedPlayer];
    } else {
      // Replace oldest pick
      updatedNewPicks = [...newPicks.slice(1), normalizedPlayer];
    }
    
    setNewPicks(updatedNewPicks);
  };

  const movePlayer = (dragIndex: number, hoverIndex: number) => {
    if (dragIndex === hoverIndex) return;
    
    const updatedPicks = [...newPicks];
    const draggedPlayer = updatedPicks[dragIndex];
    const targetPlayer = updatedPicks[hoverIndex];
    
    // Swap: put dragged player in hover position, target player (if any) in drag position
    updatedPicks[hoverIndex] = draggedPlayer;
    updatedPicks[dragIndex] = targetPlayer;
    
    setNewPicks(updatedPicks);
  };

  const handleLockIn = () => {
    // Create new array by swapping: take NEW pick if exists, otherwise keep CURRENT pick
    // First, remove any current picks that are being replaced by new picks
    const newPickIds = new Set(newPicks.filter(p => p).map(p => p.id));
    const remainingCurrent = selectedPlayers.filter(p => !newPickIds.has(p.id));
    
    // Merge: new picks first, then fill with remaining current picks
    const swappedPicks = [...newPicks.filter(p => p), ...remainingCurrent]
      .slice(0, 5); // Enforce max 5 cards
    
    if (swappedPicks.length > 0) {
      console.log('Locking in picks:', swappedPicks);
      
      // Start animation sequence
      setIsAnimating(true);
      
      // Step 1: After slide animation completes (1000ms), swap the data
      setTimeout(() => {
        setSelectedPlayers(swappedPicks);
        setNewPicks([]);
        setIsLocked(true);
      }, 1000);
      
      // Step 2: After grid collapses (1200ms), show stats
      setTimeout(() => {
        setShowStats(true);
      }, 1400);
      
      // Step 3: End animation state after everything completes
      setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
      
      setCooldownTime(120); // 2 minutes
      setCurrentSetScores({}); // Reset current set scores
      const state = {
        players: swappedPicks,
        lockedAt: Date.now(),
        totalScore: totalScore
      };
      localStorage.setItem(`playerPick_${homeTeamId}_${awayTeamId}`, JSON.stringify(state));
      console.log('Saved to localStorage:', state);
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
    <DndProvider backend={MultiBackend} options={HTML5toTouch}>
      <MyPreview />
      <div>


      {/* Content */}
      <div className="">
        {/* Minimalistic Score List - Vertical table format - Always show when there are selected players */}
        {selectedPlayers.length > 0 && (
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

        {/* Selection Interface - Always show when expanded OR when locked */}
        {(isExpanded || isLocked) && (
          <div className="space-y-6">
            {/* Current vs New Picks Display */}
            <div className="bg-gradient-to-r from-[#00ffe7]/10 to-[#faafe8]/10 rounded-lg p-6 border border-[#00ffe7]/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                    isLocked 
                      ? 'bg-[#00ffe7]/20 border-[#00ffe7]' 
                      : 'bg-red-500/20 border-red-500'
                  }`}>
                    {isLocked ? <FaLock className="text-[#00ffe7] text-sm" /> : <FaUnlock className="text-red-500 text-sm" />}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">
                      {isLocked ? 'Selected Picks' : `Your Picks (${newPicks.filter(p => p).length}/5)`}
                    </h4>
                    {isLocked && (
                      <p className="text-[#b0b7bf] text-xs">
                        🔒 Locked - {Math.floor(cooldownTime / 60)}:{(cooldownTime % 60).toString().padStart(2, '0')}
                      </p>
                    )}
                  </div>
                </div>
                {isLocked && (
                  <div className="text-right">
                    <div className="text-[#00ffe7] text-3xl font-bold">{totalScore + Object.values(currentSetScores).reduce((sum, score) => sum + score, 0)}</div>
                    <div className="text-[#b0b7bf] text-xs">Total pts</div>
                  </div>
                )}
              </div>

              {selectedPlayers.length > 0 || newPicks.filter(p => p).length > 0 ? (
                <div className={`grid ${isLocked && !isAnimating ? 'grid-cols-1' : 'grid-cols-2'} gap-4 transition-all duration-1000`}>
                  {/* Current Picks Column */}
                  <div>
                    {!isLocked && <div className="text-[#b0b7bf] text-xs mb-2 font-bold">CURRENT</div>}
                    <div className="space-y-2">
                      {selectedPlayers.length > 0 ? selectedPlayers.map((player, idx) => {
                        const headshotUrl = typeof player.headshot === 'string' ? player.headshot : player.headshot?.href;
                        const playerScore = currentSetScores[player.id] || 0;
                        // Check if this current pick is being replaced by a new pick
                        const isBeingReplaced = isAnimating && newPicks.filter(p => p).some(p => p && p.id !== player.id);
                        
                        return (
                          <div
                            key={player.id}
                            className={`bg-[#181a23]/90 rounded-lg p-4 border border-[#00ffe7]/30 flex items-center gap-4 h-[72px] transition-all duration-1000 ${
                              isBeingReplaced ? 'opacity-0 scale-95' : 'opacity-100'
                            }`}
                          >
                            <div className="w-6 h-6 rounded-full bg-[#00ffe7] text-black font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {idx + 1}
                            </div>
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
                              <FaUsers className="text-[#00ffe7] text-sm" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-white font-bold text-sm truncate">{player.shortName}</div>
                              <div className="text-[#00ffe7] text-xs">
                                {player.position.abbreviation}{player.jersey && ` • #${player.jersey}`}
                              </div>
                            </div>
                            
                            {/* Stats - Only show when locked */}
                            {isLocked && (
                              <div 
                                className={`flex items-center gap-4 ml-auto ${
                                  showStats ? 'opacity-100' : 'opacity-0'
                                }`} 
                                style={{ 
                                  animation: showStats ? 'fadeInStats 600ms ease-out forwards' : 'none',
                                  animationDelay: `${idx * 100}ms`
                                }}
                              >
                                <div className="text-center">
                                  <div className="text-[#b0b7bf] text-[10px]">CAR</div>
                                  <div className="text-white font-bold text-sm">0</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-[#b0b7bf] text-[10px]">YDS</div>
                                  <div className="text-white font-bold text-sm">0</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-[#b0b7bf] text-[10px]">AVG</div>
                                  <div className="text-white font-bold text-sm">0.0</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-[#b0b7bf] text-[10px]">TD</div>
                                  <div className="text-white font-bold text-sm">0</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-[#b0b7bf] text-[10px]">LONG</div>
                                  <div className="text-white font-bold text-sm">0</div>
                                </div>
                                <div className="text-center border-l-2 border-[#00ffe7]/30 pl-4">
                                  <div className="text-2xl font-bold text-[#00ffe7]">{playerScore}</div>
                                  <div className="text-[#b0b7bf] text-[10px]">PTS</div>
                                </div>
                              </div>
                            )}
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
                  {!isLocked && selectedPlayers.length > 0 && newPicks.filter(p => p).length > 0 && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                      <FaArrowRight className="text-[#00ffe7] text-2xl" />
                    </div>
                  )}

                  {/* New Picks Column - Hide when locked (but keep visible during animation) */}
                  {(!isLocked || isAnimating) && (
                    <div className={`relative transition-all duration-1000 ${
                      isAnimating ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}>
                    <div className="text-[#faafe8] text-xs mb-2 font-bold">NEW</div>
                    <div className="space-y-2">
                      {[...Array(5)].map((_, idx) => {
                        const player = newPicks[idx];
                        if (player) {
                          return <DraggablePlayerCard key={player.id} player={player} index={idx} movePlayer={movePlayer} isAnimating={isAnimating} />;
                        } else {
                          return <EmptySlot key={`empty-${idx}`} index={idx} movePlayer={movePlayer} />;
                        }
                      })}
                    </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#181a23]/50 rounded-lg p-8 border border-dashed border-[#00ffe7]/20 text-center mb-4">
                  <FaUsers className="text-gray-500 text-4xl mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Select up to 5 players</p>
                </div>
              )}

              {/* Lock In Button - Hide when locked */}
              {!isLocked && (
                <button
                  onClick={handleLockIn}
                  disabled={newPicks.filter(p => p).length === 0}
                  className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all mt-4 ${
                    newPicks.filter(p => p).length > 0
                      ? 'btn-pink cursor-pointer'
                      : 'bg-gray-700/20 border-2 border-gray-600 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <FaUnlock />
                  Lock In {newPicks.filter(p => p).length > 0 ? `(${newPicks.filter(p => p).length})` : ''}
                </button>
              )}
            </div>

            {/* Team Selector & Roster - Hide when locked */}
            {!isLocked && (
              <>
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
              
              {/* Split into Offense and Defense columns */}
              <div className="grid grid-cols-2 gap-4">
                {/* Offense Column */}
                <div>
                  <h5 className="text-[#faafe8] font-bold text-sm mb-2 sticky top-0 bg-[#181a23] pb-1">OFFENSE</h5>
                  <div className="space-y-2">
                    {currentRoster.filter(player => {
                      const pos = player.position.abbreviation;
                      return ['QB', 'RB', 'WR', 'TE', 'FB', 'OL', 'OT', 'OG', 'C'].includes(pos);
                    }).map((player) => {
                      const isInNew = newPicks.filter(p => p).some((p) => p.id === player.id);
                      const isInCurrent = selectedPlayers.some((p) => p.id === player.id);
                      const isDuplicate = isInCurrent && !isInNew;
                      const headshotUrl = typeof player.headshot === 'string' ? player.headshot : player.headshot?.href;
                      return (
                        <button
                          key={player.id}
                          onClick={() => handlePlayerSelect(player)}
                          disabled={isDuplicate}
                          className={`w-full p-2 rounded-lg flex items-center gap-2 transition-all text-left ${
                            isDuplicate
                              ? 'bg-gray-700/20 border-2 border-gray-600 opacity-50 cursor-not-allowed'
                              : isInNew
                              ? 'bg-[#00ffe7]/20 border-2 border-[#00ffe7]'
                              : 'bg-[#23263a]/50 border-2 border-transparent hover:border-[#00ffe7]/30 cursor-pointer'
                          }`}
                        >
                          {headshotUrl ? (
                            <img
                              src={headshotUrl}
                              alt={player.displayName}
                              className="w-8 h-8 rounded-full object-cover border-2 border-[#00ffe7]/50 flex-shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="w-8 h-8 rounded-full bg-[#23263a] border-2 border-[#00ffe7]/50 flex items-center justify-center flex-shrink-0"
                            style={{ display: headshotUrl ? 'none' : 'flex' }}
                          >
                            <FaUsers className="text-[#00ffe7] text-xs" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-bold text-xs truncate">{player.shortName}</div>
                            <div className="text-gray-400 text-[10px]">
                              {player.position.abbreviation} {player.jersey && `• #${player.jersey}`}
                            </div>
                          </div>
                          {isInNew && <FaCheckCircle className="text-[#00ffe7] flex-shrink-0 text-xs" />}
                          {isDuplicate && <FaLock className="text-gray-500 flex-shrink-0 text-xs" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Defense Column */}
                <div>
                  <h5 className="text-[#faafe8] font-bold text-sm mb-2 sticky top-0 bg-[#181a23] pb-1">DEFENSE</h5>
                  <div className="space-y-2">
                    {currentRoster.filter(player => {
                      const pos = player.position.abbreviation;
                      return ['DE', 'DT', 'LB', 'CB', 'S', 'DB', 'DL', 'SAF', 'MLB', 'OLB'].includes(pos);
                    }).map((player) => {
                      const isInNew = newPicks.filter(p => p).some((p) => p.id === player.id);
                      const isInCurrent = selectedPlayers.some((p) => p.id === player.id);
                      const isDuplicate = isInCurrent && !isInNew;
                      const headshotUrl = typeof player.headshot === 'string' ? player.headshot : player.headshot?.href;
                      return (
                        <button
                          key={player.id}
                          onClick={() => handlePlayerSelect(player)}
                          disabled={isDuplicate}
                          className={`w-full p-2 rounded-lg flex items-center gap-2 transition-all text-left ${
                            isDuplicate
                              ? 'bg-gray-700/20 border-2 border-gray-600 opacity-50 cursor-not-allowed'
                              : isInNew
                              ? 'bg-[#00ffe7]/20 border-2 border-[#00ffe7]'
                              : 'bg-[#23263a]/50 border-2 border-transparent hover:border-[#00ffe7]/30 cursor-pointer'
                          }`}
                        >
                          {headshotUrl ? (
                            <img
                              src={headshotUrl}
                              alt={player.displayName}
                              className="w-8 h-8 rounded-full object-cover border-2 border-[#00ffe7]/50 flex-shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="w-8 h-8 rounded-full bg-[#23263a] border-2 border-[#00ffe7]/50 flex items-center justify-center flex-shrink-0"
                            style={{ display: headshotUrl ? 'none' : 'flex' }}
                          >
                            <FaUsers className="text-[#00ffe7] text-xs" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-bold text-xs truncate">{player.shortName}</div>
                            <div className="text-gray-400 text-[10px]">
                              {player.position.abbreviation} {player.jersey && `• #${player.jersey}`}
                            </div>
                          </div>
                          {isInNew && <FaCheckCircle className="text-[#00ffe7] flex-shrink-0 text-xs" />}
                          {isDuplicate && <FaLock className="text-gray-500 flex-shrink-0 text-xs" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
        </>
        )}
          </div>
        )}
      </div>
    </div>
    </DndProvider>
  );
};

export default PlayerPick;
