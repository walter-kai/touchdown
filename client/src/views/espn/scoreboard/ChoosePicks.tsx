import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { FaUsers, FaLock, FaUnlock, FaClock, FaCheckCircle, FaFootballBall, FaTimes, FaArrowRight, FaPlus, FaCrosshairs, FaHandPointer, FaListUl } from 'react-icons/fa';
import PlayLog from '@/components/espn/PlayLog';
import LoadingFootball from '../../../components/loading/LoadingFootball';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend, getEmptyImage } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { MultiBackend, TouchTransition, MouseTransition } from 'react-dnd-multi-backend';
import { usePreview } from 'react-dnd-preview';
import FootballField from '@/views/espn/scoreboard/games/FootballField';
import type { Athlete } from '@/types/espn/athlete';
import { usePicks } from '../../../providers/PicksContext';
import { useLeague } from '../../../providers/LeagueContext';
import { PlayNfl } from '@/types/espn/plays';
import { debugLog } from '@/utils/debugLog';
import { getTeamApiUrl } from '@/utils/espnApi';
import { getTeamLogoUrl, getHeadshotUrl as getHeadshotUrlUtil } from '@/utils/espnImages';

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
  playerScore?: number;
}

const DraggablePlayerCard: React.FC<DraggablePlayerCardProps> = ({ player, index, movePlayer, isAnimating, playerScore = 0 }) => {
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

  // Derive league from URL to avoid race condition
  const urlLeague = window.location.pathname.startsWith('/nba') ? 'nba' : 'nfl';
  const headshotUrl = getHeadshotUrlUtil({ id: player.id, headshot: player.headshot }, urlLeague);
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
      {/* Score */}
      <div className="text-center relative z-10">
        <div className="text-2xl font-bold text-neon-pink">{playerScore}</div>
        <div className="text-text-muted text-[10px]">PTS</div>
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
  const urlLeague = window.location.pathname.startsWith('/nba') ? 'nba' : 'nfl';
  const headshotUrl = getHeadshotUrlUtil({ id: item.player.id, headshot: item.player.headshot }, urlLeague);
  const teamLogo = item.player.team?.logo || (item.player.team?.logos && item.player.team.logos.length > 0 ? item.player.team.logos[0].href : null);
  
  return (
    <div 
      style={{
        ...style,
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 100,
        left: style.x,
        top: 0,
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

const ChoosePicks = forwardRef<{ openRoster: () => void }, PlayerPickProps>((
  {
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
  getTeamLogo
},
ref
) => {
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
  const [showGameLog, setShowGameLog] = useState(false);
  const [allPlayerScores, setAllPlayerScores] = useState<Record<string, number>>({});
  const rosterSelectorRef = React.useRef<HTMLDivElement>(null);

  // Pre-game lock logic
  const normalizedGameStatus = (gameStatus || '').toLowerCase();
  const isGameLiveOrDone = ['in', 'post', 'final', 'completed', 'end'].includes(normalizedGameStatus);
  const isPreGame = !isGameLiveOrDone;
  const preGameUnlockTimestamp = React.useMemo(() => {
    if (!gameStartDate) return null;
    const timestamp = new Date(gameStartDate).getTime() - 2 * 60 * 1000;
    console.log('ChoosePicks - Game start:', gameStartDate, 'Unlock timestamp:', new Date(timestamp).toISOString(), 'Diff from now:', timestamp - Date.now());
    return timestamp;
  }, [gameStartDate]);
  const [preGameCountdownMs, setPreGameCountdownMs] = React.useState<number | null>(null);

  // Update countdown
  React.useEffect(() => {
    if (!isPreGame || !preGameUnlockTimestamp) {
      setPreGameCountdownMs(null);
      return;
    }
    
    const updateCountdown = () => {
      const diff = preGameUnlockTimestamp - Date.now();
      setPreGameCountdownMs(diff > 0 ? diff : 0);
    };
    
    updateCountdown();
    const timerId = setInterval(updateCountdown, 1000);
    return () => clearInterval(timerId);
  }, [isPreGame, preGameUnlockTimestamp]);

  const isPreGameLocked = isPreGame && (
    !preGameUnlockTimestamp || Date.now() < preGameUnlockTimestamp
  );

  const formatPreGameCountdown = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Expose method to open roster via ref
  useImperativeHandle(ref, () => ({
    openRoster: () => {
      if (!isLocked) {
        setIsRosterOpen(true);
        // Expand the picks section if it's not already expanded
        if (!isExpanded && onToggle) {
          onToggle();
        }
        // Scroll to roster after animation
        setTimeout(() => {
          rosterSelectorRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 150);
      }
    }
  }));

  const playInvolvementCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    playLog.forEach(play => {
      play.athletesInvolved?.forEach((athlete) => {
        if (!athlete?.id) return;
        counts[athlete.id] = (counts[athlete.id] || 0) + 1;
      });
    });
    return counts;
  }, [playLog]);
  
  // Use picks context for scores
  const { fetchScores, getScores, refreshScores } = usePicks();

  // Fetch scores on mount and when gameId changes
  useEffect(() => {
    const loadScores = async () => {
      await fetchScores(gameId);
    };
    loadScores();
  }, [gameId, fetchScores]);

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
              let lockedAt = null;
              if (latestPick.timestamp) {
                lockedAt = latestPick.timestamp._seconds 
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
              
              // CRITICAL: Save backend data to localStorage so scoring calculation can find lock times
              const backendState = {
                players: latestPick.players,
                lockedAt: lockedAt,
                totalScore: latestPick.totalScore || 0,
                playerLockTimes: latestPick.playerLockTimes || {},
                playerHistory: latestPick.playerHistory || {}
              };
              localStorage.setItem(`playerPick_${homeTeamId}_${awayTeamId}`, JSON.stringify(backendState));
              debugLog('💾 Saved backend picks to localStorage:', backendState);
              
              return; // Skip localStorage fallback if we got backend data
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

  // Get scores from context for display
  // Refresh backend scores when playLog updates (separate effect to avoid infinite loops)
  useEffect(() => {
    if (playLog.length > 0) {
      debugLog('📊 ChoosePicks: PlayLog updated, refreshing backend scores...');
      refreshScores(gameId);
    }
  }, [playLog.length, gameId, refreshScores]);

  // Main scoring effect - separate from refresh to avoid infinite loops
  useEffect(() => {
    const scores = getScores(gameId);
    
    // If backend scores not available, calculate locally from playLog (or default to 0 if no plays yet)
    if ((!scores || Object.keys(scores.gameScores).length === 0) && selectedPlayers.length > 0) {
      debugLog('📊 ChoosePicks: Backend scores not available, calculating locally');
      
      // Calculate game scores from playLog (empty if pre-game)
      const localGameScores: Record<string, number> = {};
      if (playLog.length > 0) {
        playLog.forEach(play => {
          play.athletesInvolved?.forEach((athlete) => {
            if (!athlete?.id) return;
            localGameScores[athlete.id] = (localGameScores[athlete.id] || 0) + 1;
          });
        });
      }
      
      setAllPlayerScores(localGameScores);
      
      // Calculate user scores (accumulated) based on player history
      const savedState = localStorage.getItem(`playerPick_${homeTeamId}_${awayTeamId}`);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          const playerHistory = parsed.playerHistory || {};
          
          debugLog('🔍 Player history from state:', playerHistory);
          debugLog('🔍 First 3 plays:', playLog.slice(0, 3).map(p => ({
            text: p.text,
            quarter: p.quarter,
            clock: p.clock,
            timestamp: p.timestamp,
            timestampMs: p.timestamp instanceof Date ? p.timestamp.getTime() : new Date(p.timestamp).getTime()
          })));
          
          const sessionScores: Record<string, number> = {};
          let calculatedTotalScore = 0;
          
          // Use the overall lock time for ALL players (when picks were submitted)
          const pickLockTime = parsed.lockedAt;
          const lockTimeMs = typeof pickLockTime === 'number' ? pickLockTime : new Date(pickLockTime).getTime();
          
          debugLog(`🔍 All players locked at: ${new Date(lockTimeMs).toISOString()}`);
          
          selectedPlayers.forEach(player => {
            // Count all plays for this player that happened AFTER the lock time
            let playerScore = 0;
            let totalPlaysForPlayer = 0;
            let playsBeforeLock = 0;
            
            playLog.forEach((play) => {
              if (!play.athletesInvolved) return;
              
              const hasPlayer = play.athletesInvolved.some((a: any) => a?.id === player.id);
              if (hasPlayer) {
                totalPlaysForPlayer++;
                
                const playTimeMs = play.timestamp instanceof Date 
                  ? play.timestamp.getTime() 
                  : new Date(play.timestamp).getTime();
                
                if (playTimeMs >= lockTimeMs) {
                  playerScore++;
                  if (playerScore <= 3) {
                    debugLog(`  ✓ Play ${playerScore}: ${play.text.substring(0, 40)}... at ${new Date(playTimeMs).toISOString()}`);
                  }
                } else {
                  playsBeforeLock++;
                }
              }
            });
            
            sessionScores[player.id] = playerScore;
            debugLog(`📊 ${player.shortName}: ${playerScore} plays after lock (${playsBeforeLock} before, ${totalPlaysForPlayer} total)`);
            calculatedTotalScore += playerScore;
          });
          
          setCurrentSetScores(sessionScores);
          setTotalScore(calculatedTotalScore);
          debugLog('✅ Session scores calculated:', { sessionScores, calculatedTotalScore });
        } catch (e) {
          console.error('Error calculating user scores:', e);
        }
      }
      return;
    }
    
    if (!scores) {
      console.warn('⚠️ ChoosePicks: No scores available from context yet');
      return;
    }

    debugLog('📊 ChoosePicks: Using scores from context:', scores);

    // Set game scores for all roster players (TOTAL column)
    setAllPlayerScores(scores.gameScores);

    // Set SESSION scores for selected players (MY SCORE column)
    // Shows plays since current lock time, not accumulated history
    if (selectedPlayers.length > 0) {
      const sessionScores: Record<string, number> = {};
      selectedPlayers.forEach(player => {
        // Use sessionScores which shows plays since current lock period only
        sessionScores[player.id] = scores.sessionScores[player.id] || 0;
      });
      setCurrentSetScores(sessionScores);
      setTotalScore(scores.totalScore);
    } else {
      setCurrentSetScores({});
      setTotalScore(0);
    }
  }, [selectedPlayers, gameId, getScores, playLog, homeTeamId, awayTeamId]);

  // Roster player scores are now provided by context (allPlayerScores is set above)

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
    
    const isHome = homeRoster.some(p => p.id === player.id);
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
      
      // Build player lock times - preserve existing for kept players, add new for new players
      const playerLockTimes: Record<string, number> = {};
      
      swappedPicks.forEach((player, idx) => {
        // If this player was already in selectedPlayers, keep their original lock time
        if (selectedPlayers.some(p => p.id === player.id) && existingPlayerLockTimes[player.id]) {
          playerLockTimes[player.id] = existingPlayerLockTimes[player.id];
        } else {
          // New player - set lock time to now (milliseconds)
          playerLockTimes[player.id] = currentTime;
        }
      });
      
      debugLog('🔒 Player lock times:', Object.entries(playerLockTimes).map(([id, time]) => ({
        id,
        time: new Date(time).toISOString()
      })));
      
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
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('localStorageUpdate', { 
        detail: { key: `playerPick_${homeTeamId}_${awayTeamId}` } 
      }));
      debugLog('Saved to localStorage:', state);
      
      // Don't do immediate calculation here - it's expensive and blocks the UI
      // The useEffect will recalculate scores when selectedPlayers updates in 1200ms
      // By then the animation will be done anyway
      
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
  const currentTeamAbbr = activeTeam === 'home' 
    ? (homeTeam?.team?.abbreviation || homeTeamInfo?.name?.substring(0, 3).toUpperCase() || 'HOME')
    : (awayTeam?.team?.abbreviation || awayTeamInfo?.name?.substring(0, 3).toUpperCase() || 'AWAY');
  const currentTeamLogo = getTeamLogoUrl(currentTeamAbbr, league);

  if (loading) {
    return <LoadingFootball message="Loading players..." />;
  }

  // Show countdown panel when game hasn't started
  if (isPreGameLocked) {
    const preGameUnlockDate = preGameUnlockTimestamp ? new Date(preGameUnlockTimestamp) : null;
    return (
      <div className="px-4 pt-12">
        <div className="bg-gradient-to-r from-neon-cyan/10 via-bg-darkest to-neon-pink/10 border border-neon-cyan/30 rounded-2xl shadow-[0_0_24px_rgba(0,255,231,0.25)] p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-neon-cyan/20 border-2 border-neon-cyan flex items-center justify-center">
                <FaClock className="text-neon-cyan text-xl" />
              </div>
              <div>
                <div className="text-white font-bold text-lg leading-tight">Kickoff Countdown</div>
                <div className="text-text-muted text-sm">
                  Picks unlock 2 minutes before kickoff
                  {preGameUnlockDate ? ` (${preGameUnlockDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })})` : ''}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-neon-cyan text-4xl font-mono leading-none">
                {preGameCountdownMs !== null && preGameCountdownMs > 0 ? formatPreGameCountdown(preGameCountdownMs) : '0s'}
              </div>
              <div className="text-text-muted text-xs mt-1">Until picks open</div>
            </div>
          </div>
          {gameStartDate && (
            <div className="mt-4 text-text-muted text-xs">
              Game starts at {new Date(gameStartDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} • Your picks will be available right after this timer hits 00:00.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={MultiBackend} options={HTML5toTouch}>
      <MyPreview />
      <div>


      {/* Content */}
   




        {/* Selection Interface - Always show when expanded OR when locked */}
        {(isExpanded || isLocked) && (
          <div className="space-y-2">


            {/* Current vs New Picks Display */}
     
            {/* Divider */}
            <div className="border-t-2 border-neon-cyan/20"></div>
            
            <div className="flex items-center justify-between py-2 pr-2 mx-2 min-h-[76px]">
              <div>
                  <h1>
                    {isLocked ? 'Selected Picks' : 'Your Picks'}
                  </h1>
              </div>
              
              {/* Lock In Button or Total Score */}
              {!isLocked && isRosterOpen ? (
                <button
                onClick={handleLockIn}
                disabled={newPicks.filter(p => p).length === 0 || isLockingIn}
                className={`btn-pink py-2 px-4 flex items-center justify-center gap-2 min-w-[120px] h-[50px] transition-opacity duration-300 rounded font-bold ${
                  newPicks.filter(p => p).length === 0 || isLockingIn
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
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

                </div>
              )}
            </div>

            <div className="relative flex gap-2 mx-2">
              {/* Current Picks Column */}
              <div 
                className="transition-all duration-800 ease-in-out"
                style={{
                  width: (isRosterOpen && !isLocked) || isViewTransitioning || isAnimating ? 'calc(50% - 0.5rem)' : '100%'
                }}>
                <div className="text-text-muted text-xs mb-2 font-bold h-[20px] flex items-center justify-between">
                  <div>
                    {isLocked ? (
                      <div className="flex items-center gap-2">
                        🔒 Locked
                      </div>
                    ) : (
                      'CURRENT'
                    )}
                  </div>
                  {/* Show column headers when roster is closed */}
                  {!isRosterOpen && showStats && (
                    <div className="flex items-center gap-3 pr-3">
                      {/* Check if we have any scores (if all are 0, ESPN data not available) */}
                      {Object.values(allPlayerScores).some(score => score > 0) || totalScore > 0 ? (
                        <>
                          <div className="text-[10px] text-neon-pink font-bold text-center" style={{ width: '50px' }}>
                            TOTAL
                          </div>
                          <div className="text-[10px] text-neon-cyan font-bold text-center" style={{ width: '50px' }}>
                            MY SCORE
                          </div>
                        </>
                      ) : (
                        <div className="text-[9px] text-yellow-400 font-semibold text-right">
                          Scores unavailable
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {[...Array(5)].map((_, idx) => {
                    const player = selectedPlayers[idx];
                    if (!player) {
                      return (
                        <div
                          key={`empty-current-${idx}`}
                          className="bg-bg-dark/50 rounded-lg p-4 border border-dashed border-neon-cyan/20 flex items-center gap-4 h-[72px]"
                        >
                          <div className="w-7 h-6 rounded-full bg-neon-cyan/20 text-neon-cyan font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div className="text-text-muted text-sm">Empty Slot</div>
                        </div>
                      );
                    }

                    const urlLeague = window.location.pathname.startsWith('/nba') ? 'nba' : 'nfl';
                    const headshotUrl = getHeadshotUrlUtil({ id: player.id, headshot: player.headshot }, urlLeague);
                    const playerScore = currentSetScores[player.id] || 0;
                    const teamLogo = player.team?.logo || (player.team?.logos && player.team.logos.length > 0 ? player.team.logos[0].href : null);
                    // Check if THIS specific pick is being replaced by checking if there's a new pick at this index
                    const isBeingReplaced = isAnimating && newPicks[idx] && newPicks[idx].id !== player.id;
                    
                    return (
                      <div
                        key={player.id}
                        className={`relative overflow-hidden bg-bg-dark/90 rounded-lg p-4 border border-neon-cyan/30 flex items-center gap-4 h-[72px] transition-all duration-300 hover:border-neon-cyan/60 ${
                          isBeingReplaced ? 'opacity-0' : 'opacity-100'
                        }`}
                        style={{
                          marginBottom: '8px',
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
                            className="w-12 h-12 rounded-full object-cover border-2 border-neon-cyan/50 flex-shrink-0 relative z-10"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                              const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-12 h-12 rounded-full bg-bg-darker border-2 border-neon-cyan/50 flex items-center justify-center flex-shrink-0 relative z-10"
                          style={{ display: headshotUrl ? 'none' : 'flex' }}
                        >
                          <FaUsers className="text-neon-cyan text-sm" />
                        </div>
                        <div className="flex-1 min-w-0 relative z-10">
                          <div className="text-white font-bold text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                            {player.displayName}
                          </div>
                          <div className="text-neon-cyan text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                            {typeof player.position === 'string' ? player.position : player.position?.abbreviation}{player.jersey && ` • #${player.jersey}`}
                          </div>
                        </div>
                        
                        {/* Score - Show differently based on roster state */}
                        {!isRosterOpen && showStats ? (
                          // Full view: Show both game and session scores
                          <div className="flex items-center gap-3 relative z-10">
                            <div className="text-center" style={{ width: '50px' }}>
                              <div className="text-2xl font-bold text-neon-pink">{allPlayerScores[player.id] || 0}</div>
                            </div>
                            <div className="text-center" style={{ width: '50px' }}>
                              <div className="text-2xl font-bold text-neon-cyan">{playerScore}</div>
                            </div>
                          </div>
                        ) : isRosterOpen ? (
                          // Compressed view: Show only session score
                          <div className="text-center relative z-10">
                            <div className="text-2xl font-bold text-neon-cyan">{playerScore}</div>
                            <div className="text-text-muted text-[10px]">PTS</div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>


              {/* New Picks Column - Show when roster is open and not locked */}
              {!isLocked && isRosterOpen && (
                <div 
                  className="transition-all duration-800 ease-in-out"
                  style={{
                    width: 'calc(50% - 0.5rem)',
                  }}
                >
                <div className="text-neon-pink text-xs mb-2 font-bold h-[20px] flex items-center">NEW</div>
                <div className="space-y-2">
                  {[...Array(5)].map((_, idx) => {
                    const player = newPicks[idx];
                    if (player) {
                      // For NEW picks, show session score (time-filtered)
                      const playerScore = currentSetScores[player.id] || 0;
                      return <DraggablePlayerCard key={player.id} player={player} index={idx} movePlayer={movePlayer} isAnimating={isAnimating} playerScore={playerScore} />;
                    } else {
                      return <EmptySlot key={`empty-${idx}`} index={idx} movePlayer={movePlayer} isActive={activeSlot === idx} onSlotClick={(slotIndex) => setActiveSlot(activeSlot === slotIndex ? null : slotIndex)} />;
                    }
                  })}
                </div>
                </div>
              )}
            </div>
      

            {/* Pick Button - Only show when not locked */}
            {!isLocked && (
              <div className="pb-2 mx-2">
                <button
                  onClick={(e) => {
                  if (!isRosterOpen && isExpanded) {
                    // Open roster - trigger both width change and fade together
                    setIsRosterOpen(true);
                    // Scroll to roster selector after a brief delay for animation
                    setTimeout(() => {
                      rosterSelectorRef.current?.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                      });
                    }, 150);
                  } else {
                    // Toggle roster state
                    setIsRosterOpen(!isRosterOpen);
                    if (!isRosterOpen) {
                      // Scroll to roster selector when opening
                      setTimeout(() => {
                        rosterSelectorRef.current?.scrollIntoView({ 
                          behavior: 'smooth', 
                          block: 'start' 
                        });
                      }, 150);
                    }
                  }
                  }}
                  className={`w-full p-4 flex items-center justify-center gap-3 transition-all ${
                  isRosterOpen 
                    ? 'bg-gradient-to-r from-neon-pink/10 to-neon-pink/5 border-2 border-neon-pink/30 text-neon-pink hover:border-neon-pink/50' 
                    : 'btn-green'
                  }`}>
                  <FaHandPointer className="text-xl" />
                  <span>{isRosterOpen ? 'Close' : 'Pick Players'}</span>
                </button>
              </div>
            )}

            {/* Countdown Timer Panel - Only show when locked */}
            {isLocked && (
              <div className={`space-y-4 transition-all duration-700 mx-2 ${
                showStats ? 'opacity-100' : 'opacity-0'
              }`}>
                <div className="bg-gradient-to-r from-neon-cyan/5 to-neon-pink/5 rounded-lg p-4 border border-neon-cyan/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neon-cyan/20 border-2 border-neon-cyan flex items-center justify-center">
                        <FaLock className="text-neon-cyan text-sm" />
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">Picks Locked</div>
                        <div className="text-text-muted text-xs">Next selection available in</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaClock className="text-neon-cyan text-xl" />
                      <div className="text-neon-cyan text-3xl font-bold font-mono">
                        {Math.floor(cooldownTime / 60)}:{(cooldownTime % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Team Selector & Roster - Show when roster is open and not locked */}
            {!isLocked && isRosterOpen && (
              <div className="animate-fade-in">
            {/* Team Selector */}
            <div ref={rosterSelectorRef} className="flex mx-2">
                <button
                onClick={() => setActiveTeam('home')}
                className={`flex-1 py-3 rounded-tl-[5px] font-bold flex items-center justify-center gap-2 transition-all border ${
                  activeTeam === 'home'
                  ? 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan'
                  : 'bg-bg-dark border-neon-cyan/20 text-gray-400 hover:border-neon-cyan/30'
                }`}
                >
                {homeTeam?.team?.abbreviation && <img src={getTeamLogoUrl(homeTeam.team.abbreviation, league)} alt="" className="w-7 h-6" />}
                {homeTeamInfo.name}
                </button>
              <button
                onClick={() => setActiveTeam('away')}
                className={`flex-1 py-3 rounded-tr-[5px] font-bold flex items-center justify-center gap-2 transition-all border ${
                  activeTeam === 'away'
                    ? 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan'
                    : 'bg-bg-dark border-neon-cyan/20 text-gray-400 hover:border-neon-cyan/30'
                }`}
              >
                {awayTeam?.team?.abbreviation && <img src={getTeamLogoUrl(awayTeam.team.abbreviation, league)} alt="" className="w-7 h-6" />}
                {awayTeamInfo.name}
              </button>
            </div>

            {/* Player List */}
            <div className="bg-bg-dark/90 rounded-b-lg py-4 mx-2">

              
              {/* Split into Offense/Guards and Defense/Forwards columns */}
              <div className="grid grid-cols-2 gap-2">
                {/* Offense/Guards Column */}
                <div>
                  <h5 className="text-neon-pink font-bold text-sm mb-2">{league === 'nfl' ? 'OFFENSE' : 'GUARDS'}</h5>
                  <div className="space-y-2">
                    {currentRoster.filter(player => {
                      const pos = typeof player.position === 'string' ? player.position : player.position?.abbreviation;
                      if (league === 'nfl') {
                        return ['QB', 'RB', 'WR', 'TE', 'FB', 'OL', 'OT', 'OG', 'C'].includes(pos);
                      } else {
                        // NBA: Guards and Guard-Forwards
                        return ['PG', 'SG', 'G', 'G-F'].includes(pos);
                      }
                    }).sort((a, b) => (playInvolvementCounts[b.id] || 0) - (playInvolvementCounts[a.id] || 0)).map((player) => {
                      const playerScore = playInvolvementCounts[player.id] || 0;
                      const isInNew = newPicks.filter(p => p).some((p) => p.id === player.id);
                      const isInCurrent = selectedPlayers.some((p) => p.id === player.id);
                      const isDuplicate = isInCurrent && !isInNew;
                      const urlLeague = window.location.pathname.startsWith('/nba') ? 'nba' : 'nfl';
                      const headshotUrl = getHeadshotUrlUtil({ id: player.id, headshot: player.headshot }, urlLeague);
                      return (
                        <button
                          key={player.id}
                          onClick={() => handlePlayerSelect(player)}
                          disabled={isDuplicate}
                          className={`w-full p-2 rounded-lg flex items-center gap-2 transition-all text-left ${
                            isDuplicate
                              ? 'bg-gray-700/20 border border-gray-600/50 opacity-50 cursor-not-allowed'
                              : isInNew
                              ? 'bg-neon-cyan/20 border border-neon-cyan/60'
                              : 'bg-bg-darker/50 border border-transparent hover:border-neon-cyan/30 cursor-pointer'
                          }`}
                        >
                          {headshotUrl ? (
                            <img
                              src={headshotUrl}
                              alt={player.displayName}
                              className="w-8 h-8 rounded-full object-cover border-2 border-neon-cyan/50 flex-shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="w-8 h-8 rounded-full bg-bg-darker border-2 border-neon-cyan/50 flex items-center justify-center flex-shrink-0"
                            style={{ display: headshotUrl ? 'none' : 'flex' }}
                          >
                            <FaUsers className="text-neon-cyan text-xs" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-bold text-xs truncate">{player.shortName}</div>
                            <div className="text-gray-400 text-[10px]">
                              {typeof player.position === 'string' ? player.position : player.position?.abbreviation} {player.jersey && `• #${player.jersey}`}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-neon-cyan font-bold text-sm">{playerScore}</div>
                            <div className="text-text-muted text-[9px]">plays</div>
                          </div>
                          {isInNew && <FaCheckCircle className="text-neon-cyan flex-shrink-0 text-xs ml-2" />}
                          {isDuplicate && <FaLock className="text-gray-500 flex-shrink-0 text-xs ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Defense/Forwards Column */}
                <div>
                  <h5 className="text-neon-pink font-bold text-sm mb-2">{league === 'nfl' ? 'DEFENSE' : 'FORWARDS/CENTERS'}</h5>
                  <div className="space-y-2">
                    {currentRoster.filter(player => {
                      const pos = typeof player.position === 'string' ? player.position : player.position?.abbreviation;
                      if (league === 'nfl') {
                        return ['DE', 'DT', 'LB', 'CB', 'S', 'DB', 'DL', 'SAF', 'MLB', 'OLB'].includes(pos);
                      } else {
                        // NBA: Forwards, Centers, and Forward-Centers
                        return ['SF', 'PF', 'C', 'F', 'F-C'].includes(pos);
                      }
                    }).sort((a, b) => (playInvolvementCounts[b.id] || 0) - (playInvolvementCounts[a.id] || 0)).map((player) => {
                      const playerScore = playInvolvementCounts[player.id] || 0;
                      const isInNew = newPicks.filter(p => p).some((p) => p.id === player.id);
                      const isInCurrent = selectedPlayers.some((p) => p.id === player.id);
                      const isDuplicate = isInCurrent && !isInNew;
                      const urlLeague = window.location.pathname.startsWith('/nba') ? 'nba' : 'nfl';
                      const headshotUrl = getHeadshotUrlUtil({ id: player.id, headshot: player.headshot }, urlLeague);
                      return (
                        <button
                          key={player.id}
                          onClick={() => handlePlayerSelect(player)}
                          disabled={isDuplicate}
                          className={`w-full p-2 rounded-lg flex items-center gap-2 transition-all text-left ${
                            isDuplicate
                              ? 'bg-gray-700/20 border border-gray-600/50 opacity-50 cursor-not-allowed'
                              : isInNew
                              ? 'bg-neon-cyan/20 border border-neon-cyan/60'
                              : 'bg-bg-darker/50 border border-transparent hover:border-neon-cyan/30 cursor-pointer'
                          }`}
                        >
                          {headshotUrl ? (
                            <img
                              src={headshotUrl}
                              alt={player.displayName}
                              className="w-8 h-8 rounded-full object-cover border-2 border-neon-cyan/50 flex-shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="w-8 h-8 rounded-full bg-bg-darker border-2 border-neon-cyan/50 flex items-center justify-center flex-shrink-0"
                            style={{ display: headshotUrl ? 'none' : 'flex' }}
                          >
                            <FaUsers className="text-neon-cyan text-xs" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-bold text-xs truncate">{player.shortName}</div>
                            <div className="text-gray-400 text-[10px]">
                              {typeof player.position === 'string' ? player.position : player.position?.abbreviation} {player.jersey && `• #${player.jersey}`}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-neon-cyan font-bold text-sm">{playerScore}</div>
                            <div className="text-text-muted text-[9px]">plays</div>
                          </div>
                          {isInNew && <FaCheckCircle className="text-neon-cyan flex-shrink-0 text-xs ml-2" />}
                          {isDuplicate && <FaLock className="text-gray-500 flex-shrink-0 text-xs ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
        </div>
        )}
          </div>
        )}
      </div>
    </DndProvider>
  );
});

ChoosePicks.displayName = 'ChoosePicks';

export default ChoosePicks;
