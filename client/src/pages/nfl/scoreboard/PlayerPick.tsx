import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUsers, FaLock, FaUnlock, FaClock, FaCheckCircle, FaFootballBall, FaTimes, FaArrowRight, FaPlus, FaCrosshairs, FaHandPointer } from 'react-icons/fa';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend, getEmptyImage } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { MultiBackend, TouchTransition, MouseTransition } from 'react-dnd-multi-backend';
import { usePreview } from 'react-dnd-preview';
import Situation from './situation';

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
  gameId: string;
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
  situation?: {
    lastPlay?: {
      start?: { yardLine: number };
      end?: { yardLine: number };
      athletesInvolved?: Array<{
        displayName: string;
        headshot: string;
        position: string;
      }>;
    };
    downDistanceText?: string;
    possession?: string;
    awayTimeouts?: number;
    homeTimeouts?: number;
  };
  homeTeam?: {
    id: string;
    team: {
      displayName: string;
      abbreviation: string;
      logo?: string;
      logos?: Array<{ href: string }>;
    };
  };
  awayTeam?: {
    id: string;
    team: {
      displayName: string;
      abbreviation: string;
      logo?: string;
      logos?: Array<{ href: string }>;
    };
  };
  getTeamLogo?: (team: any) => string;
}

const ItemTypes = {
  PLAYER: 'player',
};

interface DraggablePlayerCardProps {
  player: Athlete;
  index: number;
  movePlayer: (dragIndex: number, hoverIndex: number) => void;
  isAnimating?: boolean;
  isDragging?: boolean;
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
      className={`bg-[#181a23]/90 rounded-lg p-3 border border-[#faafe8]/30 flex items-center gap-3 h-[72px] transition-all duration-1000 ${
        isDragging ? 'opacity-100' : isAnimating ? '' : 'hover:border-[#faafe8]'
      }`}
      style={{ 
        ...(isAnimating && { 
          animation: `slideToLeft 1000ms ease-out forwards`,
          animationDelay: `${index * 100}ms`,
          willChange: 'transform'
        })
      }}
    >
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
        <div className="text-[#faafe8] text-xs">{typeof player.position === 'string' ? player.position : player.position?.abbreviation}{player.jersey && ` • #${player.jersey}`}</div>
      </div>
    </div>
  );
};

interface EmptySlotProps {
  index: number;
  movePlayer: (dragIndex: number, hoverIndex: number) => void;
  isActive: boolean;
  onSlotClick: (index: number) => void;
}

const EmptySlot: React.FC<EmptySlotProps> = ({ index, movePlayer, isActive, onSlotClick }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.PLAYER,
    drop: (item: { index: number }) => {
      movePlayer(item.index, index);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isDragging = canDrop;

  return (
    <div
      ref={drop}
      onClick={() => onSlotClick(index)}
      className={`bg-[#181a23]/50 rounded-lg p-3 border border-dashed flex items-center gap-3 h-[72px] transition-all duration-200 cursor-pointer ${
        isActive
          ? 'border-[#faafe8] bg-[#faafe8]/20 shadow-[0_0_12px_#faafe8]'
          : isOver 
          ? 'border-[#faafe8] bg-[#faafe8]/20' 
          : 'border-[#faafe8]/20 hover:border-[#faafe8]/40'
      }`}
    >
      <div className={`w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center flex-shrink-0 transition-all ${
        isActive 
          ? 'bg-[#faafe8]/30 border-[#faafe8]'
          : isOver 
          ? 'bg-[#faafe8]/30 border-[#faafe8]' 
          : 'bg-[#23263a]/50 border-[#faafe8]/20'
      }`}>
        <FaPlus className={`text-sm transition-colors ${
          isActive ? 'text-[#faafe8]' : isOver ? 'text-[#faafe8]' : 'text-[#faafe8]/40'
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-sm transition-colors ${
          isActive 
            ? 'text-[#faafe8] font-bold'
            : isOver 
            ? 'text-[#faafe8]' 
            : 'text-[#faafe8]/40'
        }`}>
          {isDragging ? 'Drag here' : isActive ? 'Select player →' : 'Pick'}
        </span>
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
          <div className="text-[#faafe8] text-[10px]">{typeof item.player.position === 'string' ? item.player.position : item.player.position?.abbreviation}</div>
        </div>
      </div>
    </div>
  );
};

const PlayerPick: React.FC<PlayerPickProps> = ({
  gameId,
  homeTeamId,
  awayTeamId,
  homeTeamInfo,
  awayTeamInfo,
  isExpanded,
  onToggle,
  playLog,
  situation,
  homeTeam,
  awayTeam,
  getTeamLogo
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
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [isViewTransitioning, setIsViewTransitioning] = useState(false);
  const [isLockingIn, setIsLockingIn] = useState(false);

  // Load saved state from localStorage and backend
  useEffect(() => {
    const loadUserPicks = async () => {
      try {
        // First check backend for user's picks
        const token = localStorage.getItem('dexter_access_token');
        if (token && gameId) {
          const response = await fetch(`/api/picks/game/${gameId}/user`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.picks && result.picks.players) {
              const picks = result.picks;
              
              // Restore selections
              setSelectedPlayers(picks.players);
              setTotalScore(picks.totalScore || 0);
              setShowStats(true);
              
              // Calculate remaining cooldown time from backend timestamp
              if (picks.timestamp) {
                const lockedAt = picks.timestamp._seconds 
                  ? picks.timestamp._seconds * 1000 
                  : new Date(picks.timestamp).getTime();
                const elapsed = Date.now() - lockedAt;
                const cooldownDuration = 120 * 1000; // 2 minutes in ms
                const remaining = cooldownDuration - elapsed;
                
                if (remaining > 0) {
                  setIsLocked(true);
                  setCooldownTime(Math.ceil(remaining / 1000));
                } else {
                  // Cooldown expired but keep selections
                  setIsLocked(false);
                }
              }
              
              return; // Skip localStorage if we got backend data
            }
          }
        }
      } catch (error) {
        console.error('Error loading user picks from backend:', error);
      }
      
      // Fallback to localStorage if backend fails or no picks found
      const savedState = localStorage.getItem(`playerPick_${homeTeamId}_${awayTeamId}`);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        
        // Always restore selections and total score
        if (parsed.players && parsed.players.length > 0) {
          setSelectedPlayers(parsed.players);
          setTotalScore(parsed.totalScore || 0);
          setShowStats(true);
        }
        
        // Check if still in cooldown period
        if (parsed.lockedAt) {
          const elapsed = Date.now() - parsed.lockedAt;
          const cooldownDuration = 120 * 1000; // 2 minutes in ms
          const remaining = cooldownDuration - elapsed;
          if (remaining > 0) {
            setIsLocked(true);
            setCooldownTime(Math.ceil(remaining / 1000));
          } else {
            // Cooldown expired but keep selections
            setIsLocked(false);
          }
        }
      }
    };
    
    loadUserPicks();
  }, [homeTeamId, awayTeamId, gameId]);

  // Calculate scores for current set based on playLog
  useEffect(() => {
    if (selectedPlayers.length === 0) {
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
  }, [playLog, selectedPlayers]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            // Just unlock - keep selections and accumulated scores
            setIsLocked(false);
            // Keep showStats true so scores remain visible
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
          // Update localStorage with remaining time
          const savedState = localStorage.getItem(`playerPick_${homeTeamId}_${awayTeamId}`);
          if (savedState) {
            const parsed = JSON.parse(savedState);
            parsed.lockedAt = Date.now() - ((120 - (prev - 1)) * 1000); // Calculate original lock time
            localStorage.setItem(`playerPick_${homeTeamId}_${awayTeamId}`, JSON.stringify(parsed));
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
      // Clear active slot if deselecting
      setActiveSlot(null);
    } else if (activeSlot !== null) {
      // Insert player into the active slot
      updatedNewPicks = [...newPicks];
      updatedNewPicks[activeSlot] = normalizedPlayer;
      // Clear active slot after insertion
      setActiveSlot(null);
    } else if (newPicks.filter(p => p).length < 5) {
      // No slot selected - add to first empty slot
      const firstEmptyIndex = newPicks.findIndex(p => !p);
      if (firstEmptyIndex !== -1) {
        updatedNewPicks = [...newPicks];
        updatedNewPicks[firstEmptyIndex] = normalizedPlayer;
      } else {
        updatedNewPicks = [...newPicks, normalizedPlayer];
      }
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

  const handleLockIn = async () => {
    // Position-by-position swap: if NEW pick exists at index, use it; otherwise keep CURRENT pick
    const swappedPicks = Array(5).fill(null).map((_, idx) => {
      // If there's a new pick at this index, use it
      if (newPicks[idx]) {
        return newPicks[idx];
      }
      // Otherwise keep the current pick at this index
      return selectedPlayers[idx] || null;
    }).filter(p => p !== null); // Remove any null entries
    
    if (swappedPicks.length > 0) {
      setIsLockingIn(true);
      console.log('Locking in picks:', swappedPicks);
      
      // Save to localStorage and backend
      const state = {
        players: swappedPicks,
        lockedAt: Date.now(),
        totalScore: totalScore
      };
      localStorage.setItem(`playerPick_${homeTeamId}_${awayTeamId}`, JSON.stringify(state));
      console.log('Saved to localStorage:', state);
      
      // Send to backend API
      try {
        const token = localStorage.getItem('dexter_access_token');
        const response = await fetch('/api/picks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            gameId,
            homeTeamId,
            awayTeamId,
            picksState: state
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Picks saved to backend:', result);
        } else {
          console.error('Failed to save picks to backend:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Error saving picks to backend:', error);
      }
      
      // Start animation sequence
      setIsAnimating(true);
      setActiveSlot(null); // Clear active slot
      
      // Step 1: After slide animation completes (1200ms with delays), swap the data and lock
      setTimeout(() => {
        setSelectedPlayers(swappedPicks);
        setNewPicks([]);
        setIsLocked(true);
        setIsRosterOpen(false); // Close roster to trigger grid shrinking
      }, 1200);
      
      // Step 2: Very shortly after lock (1250ms), end animation state to allow widening animation
      setTimeout(() => {
        setIsAnimating(false);
      }, 1250);
      
      // Step 3: After widening completes (2050ms = 1250 + 800), show stats with fade
      setTimeout(() => {
        setShowStats(true);
        setIsLockingIn(false);
      }, 2050);
      
      setCooldownTime(120); // 2 minutes
      setCurrentSetScores({}); // Reset current set scores
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
              <span className="text-[#b0b7bf] text-[10px]">Total: {totalScore + Object.values(currentSetScores).reduce((sum, score) => sum + score, 0)} pts</span>
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
                      {typeof player.position === 'string' ? player.position : player.position?.abbreviation}
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
          <div className="space-y-0">


            {/* Current vs New Picks Display */}
            <div className="my-6 bg-gradient-to-r from-[#00ffe7]/10 to-[#faafe8]/10 rounded-lg p-6 border border-[#00ffe7]/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                    isLocked 
                      ? 'bg-[#4169e1]/20 border-[#4169e1] shadow-[0_0_10px_#4169e1]' 
                      : 'bg-yellow-500/20 border-yellow-500'
                  }`}>
                    {isLocked ? <FaLock className="text-[#4169e1] text-sm" /> : <FaCrosshairs className="text-yellow-500 text-sm" />}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg transition-all duration-500">
                      {isLocked ? 'Selected Picks' : `Your Picks (${newPicks.filter(p => p).length}/5)`}
                    </h4>
                  </div>
                </div>
                
                {/* Lock In Button or Total Score */}
                {!isLocked && isRosterOpen ? (
                  <button
                    onClick={handleLockIn}
                    disabled={newPicks.filter(p => p).length === 0 || isLockingIn}
                    className={`py-2 px-4 flex items-center justify-center gap-2 min-w-[120px] h-[60px] transition-opacity duration-300 ${
                      isViewTransitioning ? 'opacity-0' : 'opacity-100'
                    } ${
                      newPicks.filter(p => p).length > 0 && !isLockingIn
                        ? 'btn-pink'
                        : 'bg-gray-700/20 border-2 border-gray-600 text-gray-500 cursor-not-allowed rounded'
                    }`}
                  >
                    {isLockingIn ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Locking...</span>
                      </>
                    ) : (
                      <>
                        <FaUnlock />
                        Lock In {newPicks.filter(p => p).length > 0 ? `(${newPicks.filter(p => p).length})` : ''}
                      </>
                    )}
                  </button>
                ) : (
                  <div className={`text-right transition-all duration-500 min-w-[120px] h-[60px] flex flex-col justify-center ${
                    isLocked ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <div className="text-[#00ffe7] text-3xl font-bold leading-tight">{totalScore + Object.values(currentSetScores).reduce((sum, score) => sum + score, 0)}</div>
                    <div className="text-[#b0b7bf] text-xs">Total pts</div>
                  </div>
                )}
              </div>

              {selectedPlayers.length > 0 || newPicks.filter(p => p).length > 0 ? (
                <div className="relative flex gap-4">
                  {/* Current Picks Column */}
                  <div 
                    className="transition-all duration-800 ease-in-out"
                    style={{
                      width: (isRosterOpen && !isLocked) || isViewTransitioning || isAnimating ? 'calc(50% - 0.5rem)' : '100%'
                    }}>
                    <div className="text-[#b0b7bf] text-xs mb-2 font-bold h-[20px] flex items-center">
                      {!isLocked ? (
                        'CURRENT'
                      ) : (
                        <div className="flex items-center gap-2">
                          🔒 Locked
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {selectedPlayers.length > 0 ? selectedPlayers.map((player, idx) => {
                        const headshotUrl = typeof player.headshot === 'string' ? player.headshot : player.headshot?.href;
                        const playerScore = currentSetScores[player.id] || 0;
                        // Check if THIS specific pick is being replaced by checking if there's a new pick at this index
                        const isBeingReplaced = isAnimating && newPicks[idx] && newPicks[idx].id !== player.id;
                        
                        return (
                          <div
                            key={player.id}
                            className={`bg-[#181a23]/90 rounded-lg p-4 border border-[#00ffe7]/30 flex items-center gap-4 h-[72px] transition-all duration-800 ${
                              isBeingReplaced ? 'opacity-30' : 'opacity-100'
                            }`}
                            style={{
                              marginBottom: '8px'
                            }}
                          >
                            <div className="w-6 h-6 rounded-full bg-[#00ffe7] text-black font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {idx + 1}
                            </div>
                            {headshotUrl ? (
                              <img
                                src={headshotUrl}
                                alt={player.displayName}
                                className="w-12 h-12 rounded-full object-cover border-2 border-[#00ffe7]/50 flex-shrink-0"
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
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-bold text-sm whitespace-nowrap overflow-hidden text-ellipsis">{player.shortName}</div>
                              <div className="text-[#00ffe7] text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                                {typeof player.position === 'string' ? player.position : player.position?.abbreviation}{player.jersey && ` • #${player.jersey}`}
                              </div>
                            </div>
                            
                            {/* Score - Show when not actively picking players */}
                            {(isLocked || !isRosterOpen) && showStats && (
                              <div 
                                className={`text-center transition-all duration-700 ${
                                  showStats ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                                }`}
                                style={{ 
                                  transitionDelay: `${idx * 100}ms`,
                                  transformOrigin: 'center'
                                }}
                              >
                                <div className="text-2xl font-bold text-[#00ffe7]">{playerScore}</div>
                                <div className="text-[#b0b7bf] text-[10px]">PTS</div>
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


                  {/* New Picks Column - Hide when locked or roster closed */}
                  {!isLocked && isRosterOpen && (
                    <div 
                      className="transition-all duration-800 ease-in-out"
                      style={{
                        width: 'calc(50% - 0.5rem)',
                        opacity: isViewTransitioning ? 0 : 1
                      }}
                    >
                    <div className="text-[#faafe8] text-xs mb-2 font-bold h-[20px] flex items-center">NEW</div>
                    <div className="space-y-2">
                      {[...Array(5)].map((_, idx) => {
                        const player = newPicks[idx];
                        if (player) {
                          return <DraggablePlayerCard key={player.id} player={player} index={idx} movePlayer={movePlayer} isAnimating={isAnimating} />;
                        } else {
                          return <EmptySlot key={`empty-${idx}`} index={idx} movePlayer={movePlayer} isActive={activeSlot === idx} onSlotClick={(slotIndex) => setActiveSlot(activeSlot === slotIndex ? null : slotIndex)} />;
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
            </div>

            {/* Toggle Button / Countdown Timer Panel */}
            {isLocked ? (
              <div className={`space-y-4 transition-all duration-700 ${
                showStats ? 'opacity-100' : 'opacity-0'
              }`}>
                <div className="bg-gradient-to-r from-[#00ffe7]/5 to-[#faafe8]/5 rounded-lg p-4 border border-[#00ffe7]/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#00ffe7]/20 border-2 border-[#00ffe7] flex items-center justify-center">
                        <FaLock className="text-[#00ffe7] text-sm" />
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">Picks Locked</div>
                        <div className="text-[#b0b7bf] text-xs">Next selection available in</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaClock className="text-[#00ffe7] text-xl" />
                      <div className="text-[#00ffe7] text-3xl font-bold font-mono">
                        {Math.floor(cooldownTime / 60)}:{(cooldownTime % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 pb-6">
                {/* Field View Button */}
                <button
                  onClick={() => {
                    if (!isExpanded) {
                      onToggle();
                    }
                    if (isRosterOpen) {
                      // Start animation sequence - fade out NEW column first
                      setIsViewTransitioning(true);
                      
                      console.log('Field clicked - closing roster. isRosterOpen:', isRosterOpen, 'isLocked:', isLocked);
                      
                      // Step 1: After fade completes, close roster (triggers grid + width change together)
                      setTimeout(() => {
                        setIsRosterOpen(false);
                        console.log('Roster closed after 800ms');
                      }, 800);
                      
                      // Step 2: Shortly after, end transition state
                      setTimeout(() => {
                        setIsViewTransitioning(false);
                      }, 850);
                    }
                  }}
                  className={`p-4 flex items-center justify-center gap-3 ${
                    isExpanded && !isRosterOpen ? 'bg-[#00ffe7]/20 border-2 border-[#00ffe7] text-[#00ffe7] rounded' : 'btn-standard'
                  }`}>
                  <FaFootballBall className="text-xl" />
                  <span>Plays</span>
                </button>

                {/* Pick Players Button */}
                <button
                  onClick={() => {
                    if (!isRosterOpen && isExpanded) {
                      // Open roster immediately (triggers grid change + shrinking together)
                      setIsRosterOpen(true);
                      
                      // Start transition for fade-in effect
                      setIsViewTransitioning(true);
                      
                      // End transition after fade completes
                      setTimeout(() => {
                        setIsViewTransitioning(false);
                      }, 800);
                    } else {
                      setIsRosterOpen(!isRosterOpen);
                    }
                  }}
                  className={`p-4 flex items-center justify-center gap-3 ${
                    isRosterOpen ? 'bg-[#00ffe7]/20 border-2 border-[#00ffe7] text-[#00ffe7] rounded' : 'btn-standard'
                  }`}>
                  <FaHandPointer className="text-xl" />
                  <span>{isRosterOpen ? 'Cancel' : 'Pick Players'}</span>
                </button>
              </div>
            )}

            {/* Field Situation View - Show when expanded and not in roster mode */}
            {isExpanded && !isRosterOpen && situation && homeTeam && awayTeam && getTeamLogo && (
              <div className="bg-gradient-to-r from-[#00ffe7]/10 to-[#faafe8]/10 rounded-lg p-6 border border-[#00ffe7]/30 animate-fade-in">
                <Situation
                  situation={situation}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  playLog={playLog}
                  getTeamLogo={getTeamLogo}
                />
              </div>
            )}
            {/* Team Selector & Roster - Show when roster is open and not locked */}
            {!isLocked && isRosterOpen && (
              <div className="animate-fade-in">
              <>
            {/* Team Selector */}
            <div className="flex gap-0">
              <button
                onClick={() => setActiveTeam('home')}
                className={`flex-1 py-3 rounded-t-lg font-bold flex items-center justify-center gap-2 transition-all border-2 ${
                  activeTeam === 'home'
                    ? 'bg-[#faafe8]/20 border-[#faafe8] text-[#faafe8]'
                    : 'bg-[#181a23] border-[#faafe8]/30 text-gray-400 hover:border-[#faafe8]/50'
                }`}
              >
                {homeTeamLogo && <img src={homeTeamLogo} alt="" className="w-6 h-6" />}
                {homeTeamInfo.name}
              </button>
              <button
                onClick={() => setActiveTeam('away')}
                className={`flex-1 py-3 rounded-t-lg font-bold flex items-center justify-center gap-2 transition-all border-2 ${
                  activeTeam === 'away'
                    ? 'bg-[#00ffe7]/20 border-[#00ffe7] text-[#00ffe7]'
                    : 'bg-[#181a23] border-[</h4>#00ffe7]/30 text-gray-400 hover:border-[#00ffe7]/50'
                }`}
              >
                {awayTeamLogo && <img src={awayTeamLogo} alt="" className="w-6 h-6" />}
                {awayTeamInfo.name}
              </button>
            </div>

            {/* Player List */}
            <div className="bg-[#181a23]/90 rounded-b-lg border-2 border-t-0 border-[#00ffe7]/30 p-4">
              <h4 className="text-[#00ffe7] font-bold mb-4 flex items-center gap-2">
                {currentTeamLogo && <img src={currentTeamLogo} alt="" className="w-6 h-6" />}
                {currentTeamInfo.name} Roster
              </h4>
              
              {/* Split into Offense and Defense columns */}
              <div className="grid grid-cols-2 gap-4">
                {/* Offense Column */}
                <div>
                  <h5 className="text-[#faafe8] font-bold text-sm mb-2">OFFENSE</h5>
                  <div className="space-y-2">
                    {currentRoster.filter(player => {
                      const pos = typeof player.position === 'string' ? player.position : player.position?.abbreviation;
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
                              {typeof player.position === 'string' ? player.position : player.position?.abbreviation} {player.jersey && `• #${player.jersey}`}
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
                  <h5 className="text-[#faafe8] font-bold text-sm mb-2">DEFENSE</h5>
                  <div className="space-y-2">
                    {currentRoster.filter(player => {
                      const pos = typeof player.position === 'string' ? player.position : player.position?.abbreviation;
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
                              {typeof player.position === 'string' ? player.position : player.position?.abbreviation} {player.jersey && `• #${player.jersey}`}
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
        </div>
        )}
          </div>
        )}
      </div>
    </div>
    </DndProvider>
  );
};

export default PlayerPick;
