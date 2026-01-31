import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import axios from 'axios';
import { FaUsers, FaLock, FaUnlock, FaClock, FaCheckCircle, FaFootballBall, FaTimes, FaArrowRight, FaPlus, FaCrosshairs, FaHandPointer, FaBolt, FaChartLine } from 'react-icons/fa';
import LoadingFootball from '../../../components/loading/LoadingFootball';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend, getEmptyImage } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { MultiBackend, TouchTransition, MouseTransition } from 'react-dnd-multi-backend';
import { usePreview } from 'react-dnd-preview';
import FootballField from '@/views/espn/scoreboard/visuals/FootballField';
import ChoosePicks from '@/pages/espn/scoreboard/ChoosePicks';
import { useAuth } from '@/providers/AuthContext';
import { useLeague } from '@/providers/LeagueContext';
import { debugLog } from '@/utils/debugLog';
import { getTeamApiUrl } from '@/utils/espnApi';
import { getTeamLogoUrl } from '@/utils/espnImages';
import type { Athlete } from '@/types/espn/athlete';
import { PlayNfl } from '@/types/espn/plays';

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
  gameStatus: string;
  gameStartDate: string;
  isExpanded: boolean;
  onToggle: () => void;
  playLog: PlayNfl[];
  situation?: {
    lastPlay?: {
      start?: { yardLine?: number };
      end?: { yardLine?: number };
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
  const teamLogo = player.team?.logo || (player.team?.logos && player.team.logos.length > 0 ? player.team.logos[0].href : null);

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`relative overflow-hidden bg-bg-dark/90 rounded-lg p-3 border border-neon-pink/30 flex items-center gap-3 h-[72px] transition-all duration-1000 ${
        isDragging ? 'opacity-100' : isAnimating ? '' : 'hover:border-neon-pink'
      }`}
      style={{ 
        ...(isAnimating && { 
          animation: `slideToLeft 1000ms ease-out forwards`,
          animationDelay: `${index * 100}ms`,
          willChange: 'transform'
        })
      }}
    >
      {/* Large team logo background */}
      {teamLogo && (
        <img 
          src={teamLogo} 
          alt="" 
          className="absolute right-[10%] top-1/2 -translate-y-1/2 opacity-10 pointer-events-none"
          style={{
            width: '120px',
            height: '120px',
            objectFit: 'contain'
          }}
        />
      )}

      {headshotUrl ? (
        <img
          src={headshotUrl}
          alt={player.displayName}
          className="w-12 h-12 rounded-full object-cover border-2 border-neon-pink/50 flex-shrink-0 relative z-10"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : null}
      <div 
        className="w-12 h-12 rounded-full bg-bg-darker border-2 border-neon-pink/50 flex items-center justify-center flex-shrink-0 relative z-10"
        style={{ display: headshotUrl ? 'none' : 'flex' }}
      >
        <FaUsers className="text-neon-pink text-sm" />
      </div>
      <div className="flex-1 min-w-0 relative z-10">
        <div className="text-white font-bold text-sm truncate">{player.shortName}</div>
        <div className="text-neon-pink text-xs">{typeof player.position === 'string' ? player.position : player.position?.abbreviation}{player.jersey && ` • #${player.jersey}`}</div>
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
      className={`bg-bg-dark/50 rounded-lg p-3 border border-dashed flex items-center gap-3 h-[72px] transition-all duration-200 cursor-pointer ${
        isActive
          ? 'border-neon-pink bg-neon-pink/20 shadow-[0_0_12px_#faafe8]'
          : isOver 
          ? 'border-neon-pink bg-neon-pink/20' 
          : 'border-neon-pink/20 hover:border-neon-pink/40'
      }`}
    >
      <div className={`w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center flex-shrink-0 transition-all ${
        isActive 
          ? 'bg-neon-pink/30 border-neon-pink'
          : isOver 
          ? 'bg-neon-pink/30 border-neon-pink' 
          : 'bg-bg-darker/50 border-neon-pink/20'
      }`}>
        <FaPlus className={`text-sm transition-colors ${
          isActive ? 'text-neon-pink' : isOver ? 'text-neon-pink' : 'text-neon-pink/40'
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-sm transition-colors ${
          isActive 
            ? 'text-neon-pink font-bold'
            : isOver 
            ? 'text-neon-pink' 
            : 'text-neon-pink/40'
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
  const teamLogo = item.player.team?.logo || (item.player.team?.logos && item.player.team.logos.length > 0 ? item.player.team.logos[0].href : null);
  
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
      <div className="relative overflow-hidden bg-bg-dark rounded-lg p-3 border-2 border-neon-pink flex items-center gap-2 shadow-2xl shadow-neon-pink/50" style={{ minHeight: '58px', minWidth: '200px' }}>
        {/* Large team logo background */}
        {teamLogo && (
          <img 
            src={teamLogo} 
            alt="" 
            className="absolute right-[10%] top-1/2 -translate-y-1/2 opacity-10 pointer-events-none"
            style={{
              width: '80px',
              height: '80px',
              objectFit: 'contain'
            }}
          />
        )}
        {headshotUrl ? (
          <img
            src={headshotUrl}
            alt={item.player.displayName}
            className="w-10 h-10 rounded-full object-cover border-2 border-neon-pink/50 flex-shrink-0 relative z-10"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-bg-darker border-2 border-neon-pink/50 flex items-center justify-center flex-shrink-0 relative z-10">
            <FaUsers className="text-neon-pink text-sm" />
          </div>
        )}
        <div className="flex-1 min-w-0 relative z-10">
          <div className="text-white font-bold text-xs truncate">{item.player.shortName}</div>
          <div className="text-neon-pink text-[10px]">{typeof item.player.position === 'string' ? item.player.position : item.player.position?.abbreviation}</div>
        </div>
      </div>
    </div>
  );
};

const PlayerPick = forwardRef<{ openRoster: () => void }, PlayerPickProps>(
  ({
  gameId,
  homeTeamId,
  awayTeamId,
  homeTeamInfo,
  awayTeamInfo,
  gameStatus,
  gameStartDate,
  isExpanded,
  onToggle,
  playLog,
  situation,
  homeTeam,
  awayTeam,
  getTeamLogo,
}, ref) => {
  const { league } = useLeague();
  const [homeRoster, setHomeRoster] = useState<Athlete[]>([]);
  const [awayRoster, setAwayRoster] = useState<Athlete[]>([]);
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
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(null);

  // MUST call useAuth at the top before any conditional returns (Rules of Hooks)
  const { isAuthenticated, triggerLoginModal } = useAuth();
  const yourPicksRef = useRef<{ openRoster: () => void }>(null);

  // Forward ref to YourPicks
  useImperativeHandle(ref, () => ({
    openRoster: () => {
      yourPicksRef.current?.openRoster();
    }
  }));

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
            // New structure: result.picks is an array of pick submissions
            if (result.picks && result.picks.picks && result.picks.picks.length > 0) {
              // Get the most recent pick (last in array)
              const latestPick = result.picks.picks[result.picks.picks.length - 1];
              
              // Restore selections from the latest pick
              setSelectedPlayers(latestPick.players);
              setTotalScore(latestPick.totalScore || 0);
              setShowStats(true);
              
              // Calculate remaining cooldown time from backend timestamp
              if (latestPick.timestamp) {
                const lockedAt = latestPick.timestamp._seconds 
                  ? latestPick.timestamp._seconds * 1000 
                  : new Date(latestPick.timestamp).getTime();
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
    
    // Get player history from localStorage (tracks when players were active)
    const savedState = localStorage.getItem(`playerPick_${homeTeamId}_${awayTeamId}`);
    let playerHistory: Record<string, Array<{ start: number; end?: number }>> = {};
    let currentPlayerLockTimes: Record<string, number> = {};
    
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        playerHistory = parsed.playerHistory || {};
        currentPlayerLockTimes = parsed.playerLockTimes || {};
      } catch (e) {
        console.error('Error parsing player history:', e);
      }
    }

    selectedPlayers.forEach(player => {
      scores[player.id] = 0;
      
      // Get all time periods this player was active
      const activePeriods = playerHistory[player.id] || [];
      
      // Add current active period if player is currently locked
      if (currentPlayerLockTimes[player.id]) {
        activePeriods.push({ start: currentPlayerLockTimes[player.id] });
      }
      
      playLog.forEach(play => {
        const playTimestamp = play.timestamp instanceof Date ? play.timestamp.getTime() : new Date(play.timestamp).getTime();
        
        // Check if play occurred during any of the player's active periods
        const playDuringActivePeriod = activePeriods.some(period => {
          const afterStart = playTimestamp >= period.start;
          const beforeEnd = !period.end || playTimestamp <= period.end;
          return afterStart && beforeEnd;
        });
        
        if (!playDuringActivePeriod) {
          return; // Skip this play - player wasn't active
        }

        if (play.athletesInvolved) {
          play.athletesInvolved.forEach(athlete => {
            if (athlete.id === player.id) {
              scores[player.id]++;
            }
          });
        }
      });
    });

    setCurrentSetScores(scores);
  }, [playLog, selectedPlayers, homeTeamId, awayTeamId]);

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
                lockedAt: null,
                playerLockTimes: parsed.playerLockTimes || {}, // Preserve player lock times
                playerHistory: parsed.playerHistory || {} // Preserve player history
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
      rosterSetter: React.Dispatch<React.SetStateAction<Athlete[]>>
    ) => {
      try {
        const response = await axios.get(
          `${getTeamApiUrl(league, teamId)}?enable=roster`
        );
        const athletes = response.data.team.athletes || [];
        rosterSetter(athletes);
      } catch (err) {
        console.error(`Error fetching roster for team ${teamId}:`, err);
      }
    };

    Promise.all([
      fetchRoster(homeTeamId, setHomeRoster),
      fetchRoster(awayTeamId, setAwayRoster)
    ]).finally(() => setLoading(false));
  }, [homeTeamId, awayTeamId]);

  const handlePlayerSelect = (player: Athlete) => {
    if (isLocked) return;

    debugLog('Raw player object:', player);
    debugLog('Player headshot type:', typeof player.headshot);
    debugLog('Player headshot value:', player.headshot);

    // Get the actual headshot URL - ESPN API provides it in player.headshot.href
    let headshotUrl: string | undefined = undefined;
    
    // Check if headshot exists and extract the URL
    if (player.headshot) {
      if (typeof player.headshot === 'object' && 'href' in player.headshot) {
        headshotUrl = player.headshot.href;
        debugLog('Extracted from object:', headshotUrl);
      } else if (typeof player.headshot === 'string') {
        headshotUrl = player.headshot;
        debugLog('Already string:', headshotUrl);
      }
    }
    
    debugLog('Final headshot URL to save:', headshotUrl);
    
    const isHome = player.team?.id === homeTeamId;
    const teamAbbr = isHome 
      ? (homeTeam?.team?.abbreviation || homeTeamInfo.name.substring(0, 3).toUpperCase())
      : (awayTeam?.team?.abbreviation || awayTeamInfo.name.substring(0, 3).toUpperCase());
    
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
        logo: getTeamLogoUrl(teamAbbr, league)
      }
    };

    debugLog('Normalized player to add:', normalizedPlayer);

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
      debugLog('Locking in picks:', swappedPicks);
      
      // Track which players are new vs kept and update player history
      const currentTime = Date.now();
      const savedState = localStorage.getItem(`playerPick_${homeTeamId}_${awayTeamId}`);
      let existingPlayerLockTimes: Record<string, number> = {};
      let playerHistory: Record<string, Array<{ start: number; end?: number }>> = {};
      
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          existingPlayerLockTimes = parsed.playerLockTimes || {};
          playerHistory = parsed.playerHistory || {};
        } catch (e) {
          console.error('Error parsing existing player data:', e);
        }
      }
      
      // Find players being removed (in selectedPlayers but not in swappedPicks)
      const removedPlayerIds = selectedPlayers
        .filter(oldPlayer => !swappedPicks.some(newPlayer => newPlayer.id === oldPlayer.id))
        .map(p => p.id);
      
      // Close out the active period for removed players
      removedPlayerIds.forEach(playerId => {
        if (existingPlayerLockTimes[playerId]) {
          if (!playerHistory[playerId]) {
            playerHistory[playerId] = [];
          }
          // Add the period from when they were locked in until now
          playerHistory[playerId].push({
            start: existingPlayerLockTimes[playerId],
            end: currentTime
          });
        }
      });
      
      // Build player lock times - preserve existing times for kept players, add new time for new players
      const playerLockTimes: Record<string, number> = {};
      swappedPicks.forEach((player, idx) => {
        // If this player was already in selectedPlayers, keep their original lock time
        if (selectedPlayers.some(p => p.id === player.id) && existingPlayerLockTimes[player.id]) {
          playerLockTimes[player.id] = existingPlayerLockTimes[player.id];
        } else {
          // New player - set lock time to now
          playerLockTimes[player.id] = currentTime;
        }
      });
      
      // Save to localStorage and backend
      const state = {
        players: swappedPicks,
        lockedAt: currentTime,
        totalScore: totalScore,
        playerLockTimes: playerLockTimes,
        playerHistory: playerHistory,
        teamData: {
          league: league,
          homeTeam: {
            name: homeTeamInfo.name,
            abbreviation: homeTeam?.team?.abbreviation || homeTeamInfo.name.substring(0, 3).toUpperCase()
          },
          awayTeam: {
            name: awayTeamInfo.name,
            abbreviation: awayTeam?.team?.abbreviation || awayTeamInfo.name.substring(0, 3).toUpperCase()
          }
        }
      };
      localStorage.setItem(`playerPick_${homeTeamId}_${awayTeamId}`, JSON.stringify(state));
      debugLog('Saved to localStorage:', state);
      
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
          debugLog('Picks saved to backend:', result);
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
        // Keep roster open - no longer closing it
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
      // Don't reset all scores - only scores for newly swapped players will be recalculated
      // Preserve existing player scores
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentRoster = activeTeam === 'home' ? homeRoster : awayRoster;
  const currentTeamInfo = activeTeam === 'home' ? homeTeamInfo : awayTeamInfo;
  
  // Construct logo URL dynamically from team abbreviation
  const currentTeamAbbr = activeTeam === 'home' 
    ? (homeTeam?.team?.abbreviation || homeTeamInfo?.name?.substring(0, 3).toUpperCase() || 'HOME')
    : (awayTeam?.team?.abbreviation || awayTeamInfo?.name?.substring(0, 3).toUpperCase() || 'AWAY');
  const currentTeamLogo = getTeamLogoUrl(currentTeamAbbr, league);

  if (loading) {
    return <LoadingFootball message="Loading players..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-cyan/20 via-bg-darkest to-neon-pink/20 border-2 border-neon-cyan/40 shadow-[0_0_30px_rgba(0,255,231,0.3)] p-6 sm:p-8">
            {/* Animated background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-neon-pink/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            
            <div className="relative z-10">
              {/* Lock Icon */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-neon-cyan blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-neon-cyan to-neon-pink flex items-center justify-center shadow-lg">
                    <FaLock className="text-bg-darkest text-2xl" />
                  </div>
                </div>
              </div>

              {/* Headline */}
              <h1>Unlock Your Picks</h1>
              <p className="text-text-muted text-center text-base mb-6">
                Join the game and start making your predictions!
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20">
                  <div className="w-8 h-8 rounded-lg bg-neon-cyan/20 flex items-center justify-center flex-shrink-0">
                    <FaCheckCircle className="text-neon-cyan text-base" />
                  </div>
                  <div>
                    <h3 className="text-text-light font-bold text-sm mb-0.5">Track Your Picks</h3>
                    <p className="text-text-muted text-xs">Follow predictions in real-time</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-neon-pink/5 border border-neon-pink/20">
                  <div className="w-8 h-8 rounded-lg bg-neon-pink/20 flex items-center justify-center flex-shrink-0">
                    <FaBolt className="text-neon-pink text-base" />
                  </div>
                  <div>
                    <h3 className="text-text-light font-bold text-sm mb-0.5">Live Updates</h3>
                    <p className="text-text-muted text-xs">Instant player scoring alerts</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20">
                  <div className="w-8 h-8 rounded-lg bg-neon-cyan/20 flex items-center justify-center flex-shrink-0">
                    <FaChartLine className="text-neon-cyan text-base" />
                  </div>
                  <div>
                    <h3 className="text-text-light font-bold text-sm mb-0.5">Performance Stats</h3>
                    <p className="text-text-muted text-xs">Track prediction accuracy</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-neon-pink/5 border border-neon-pink/20">
                  <div className="w-8 h-8 rounded-lg bg-neon-pink/20 flex items-center justify-center flex-shrink-0">
                    <FaUsers className="text-neon-pink text-base" />
                  </div>
                  <div>
                    <h3 className="text-text-light font-bold text-sm mb-0.5">Compete & Compare</h3>
                    <p className="text-text-muted text-xs">See top picks and compete</p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => triggerLoginModal()}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-pink text-bg-darkest font-bold text-base shadow-[0_0_20px_rgba(0,255,231,0.5)] hover:shadow-[0_0_30px_rgba(0,255,231,0.7)] transform hover:scale-105 transition-all duration-200"
              >
                Sign In to Start Picking
              </button>

              <p className="text-text-muted text-center text-xs mt-3">
                Free to join • No credit card required
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Your Picks Section */}
      <ChoosePicks
        ref={yourPicksRef}
        gameId={gameId}
        homeTeamId={homeTeamId}
        awayTeamId={awayTeamId}
        homeTeamInfo={homeTeamInfo}
        awayTeamInfo={awayTeamInfo}
        gameStatus={gameStatus}
        gameStartDate={gameStartDate}
        isExpanded={isExpanded}
        onToggle={onToggle}
        playLog={playLog}
        situation={situation}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        getTeamLogo={getTeamLogo}
      />
    </>
  );
});

PlayerPick.displayName = 'PlayerPick';

export default PlayerPick;
