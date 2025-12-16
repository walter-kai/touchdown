import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUsers, FaLock, FaUnlock, FaClock, FaCheckCircle, FaFootballBall, FaTimes, FaArrowRight, FaPlus, FaCrosshairs, FaHandPointer, FaListUl } from 'react-icons/fa';
import PlayLog from '@/components/nfl/PlayLog';
import LoadingFootball from '../../../components/common/LoadingFootball';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend, getEmptyImage } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { MultiBackend, TouchTransition, MouseTransition } from 'react-dnd-multi-backend';
import { usePreview } from 'react-dnd-preview';
import FootballField from '@/components/nfl/FootballField';
import type { Athlete } from '@/types/espn/athlete';

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
  const teamLogo = player.team?.logo || (player.team?.logos && player.team.logos.length > 0 ? player.team.logos[0].href : null);

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`relative overflow-hidden bg-[#181a23]/90 rounded-lg p-3 border border-[#faafe8]/30 flex items-center gap-3 h-[72px] transition-all duration-1000 ${
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
          className="w-12 h-12 rounded-full object-cover border-2 border-[#faafe8]/50 flex-shrink-0 relative z-10"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : null}
      <div 
        className="w-12 h-12 rounded-full bg-[#23263a] border-2 border-[#faafe8]/50 flex items-center justify-center flex-shrink-0 relative z-10"
        style={{ display: headshotUrl ? 'none' : 'flex' }}
      >
        <FaUsers className="text-[#faafe8] text-sm" />
      </div>
      <div className="flex-1 min-w-0 relative z-10">
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
      <div className="relative overflow-hidden bg-[#181a23] rounded-lg p-3 border-2 border-[#faafe8] flex items-center gap-2 shadow-2xl shadow-[#faafe8]/50" style={{ minHeight: '58px', minWidth: '200px' }}>
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
            className="w-10 h-10 rounded-full object-cover border-2 border-[#faafe8]/50 flex-shrink-0 relative z-10"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#23263a] border-2 border-[#faafe8]/50 flex items-center justify-center flex-shrink-0 relative z-10">
            <FaUsers className="text-[#faafe8] text-sm" />
          </div>
        )}
        <div className="flex-1 min-w-0 relative z-10">
          <div className="text-white font-bold text-xs truncate">{item.player.shortName}</div>
          <div className="text-[#faafe8] text-[10px]">{typeof item.player.position === 'string' ? item.player.position : item.player.position?.abbreviation}</div>
        </div>
      </div>
    </div>
  );
};

const YourPicks: React.FC<PlayerPickProps> = ({
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
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(null);
  const [showGameLog, setShowGameLog] = useState(false);
  const [allPlayerScores, setAllPlayerScores] = useState<Record<string, number>>({});
  const rosterSelectorRef = React.useRef<HTMLDivElement>(null);

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
              console.log('💾 Saved backend picks to localStorage:', backendState);
              
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

  // Calculate scores for current set based on playLog
  useEffect(() => {
    if (selectedPlayers.length === 0) {
      setCurrentSetScores({});
      return;
    }

    console.log('🔄 YourPicks: Calculating scores...');
    console.log('📊 Selected players:', selectedPlayers.map(p => `${p.displayName} (${p.id})`));
    console.log('📝 Total plays in log:', playLog.length);
    
    // Debug first play timestamp format
    if (playLog.length > 0 && playLog[0].timestamp) {
      const firstPlay = playLog[0];
      console.log('🕐 First play timestamp type:', typeof firstPlay.timestamp);
      console.log('🕐 First play timestamp value:', firstPlay.timestamp);
      console.log('🕐 First play timestamp instanceof Date:', firstPlay.timestamp instanceof Date);
      if (firstPlay.timestamp instanceof Date) {
        console.log('🕐 First play Date.getTime():', firstPlay.timestamp.getTime());
      } else {
        console.log('🕐 First play new Date().getTime():', new Date(firstPlay.timestamp as any).getTime());
      }
    }

    const scores: Record<string, number> = {};
    
    // Get player history from localStorage (tracks when players were active)
    const storageKey = `playerPick_${homeTeamId}_${awayTeamId}`;
    console.log('🔑 Looking for localStorage key:', storageKey);
    console.log('🏠 Home team ID:', homeTeamId);
    console.log('✈️ Away team ID:', awayTeamId);
    
    const savedState = localStorage.getItem(storageKey);
    console.log('💾 Raw savedState exists:', !!savedState);
    console.log('💾 Raw savedState length:', savedState?.length);
    if (savedState) {
      console.log('💾 Raw savedState preview:', savedState.substring(0, 200));
    }
    
    let playerHistory: Record<string, Array<{ start: number; end?: number }>> = {};
    let currentPlayerLockTimes: Record<string, number> = {};
    let globalLockedAt: number | null = null;
    
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        console.log('💾 Parsed state keys:', Object.keys(parsed));
        console.log('💾 Parsed state full:', parsed);
        playerHistory = parsed.playerHistory || {};
        currentPlayerLockTimes = parsed.playerLockTimes || {};
        globalLockedAt = parsed.lockedAt || null;
        console.log('💾 Player history from localStorage:', playerHistory);
        console.log('💾 Current lock times:', currentPlayerLockTimes);
        console.log('💾 Global lockedAt:', globalLockedAt, globalLockedAt ? new Date(globalLockedAt).toISOString() : 'null');
      } catch (e) {
        console.error('❌ Error parsing player history:', e);
      }
    } else {
      console.warn('⚠️ No saved state found in localStorage');
    }

    selectedPlayers.forEach(player => {
      scores[player.id] = 0;
      
      // Get all time periods this player was active
      let activePeriods = playerHistory[player.id] || [];
      
      // Add current active period if player is currently locked
      if (currentPlayerLockTimes[player.id]) {
        activePeriods.push({ start: currentPlayerLockTimes[player.id] });
      }
      
      // Fallback: If no specific player lock time, use the global lockedAt from saved state
      if (activePeriods.length === 0 && globalLockedAt) {
        activePeriods = [{ start: globalLockedAt }];
        console.log(`📌 Using global lockedAt for ${player.displayName}: ${new Date(globalLockedAt).toISOString()}`);
      }
      
      console.log(`🔍 ${player.displayName} (${player.id}) active periods:`, activePeriods.map(p => ({
        start: new Date(p.start).toISOString(),
        end: p.end ? new Date(p.end).toISOString() : 'ongoing'
      })));
      
      let playsInvolved = 0;
      let playsSkipped = 0;
      let playsCounted = 0;
      
      playLog.forEach((play, playIndex) => {
        // Check if player is involved - either by ID or by name in text
        let isInvolved = false;
        
        if (play.athletesInvolved && play.athletesInvolved.length > 0) {
          isInvolved = play.athletesInvolved.some(a => a.id === player.id);
        } else {
          // Fallback: Check if player name appears in play text
          const lastName = player.displayName.split(' ').pop();
          if (lastName && play.text) {
            const pattern = new RegExp(`\\b[A-Z]?\\.?${lastName}\\b`, 'i');
            isInvolved = pattern.test(play.text);
          }
        }
        
        if (isInvolved) {
          playsInvolved++;
          
          // If still no active periods defined, skip (shouldn't happen per user)
          if (activePeriods.length === 0) {
            playsSkipped++;
            console.warn(`⚠️ No active periods for ${player.displayName} - skipping play`);
            return;
          }
          
          // Handle Firestore Timestamp objects (_seconds) vs Date objects vs ISO strings
          let playTimestamp: number;
          if (play.timestamp instanceof Date) {
            playTimestamp = play.timestamp.getTime();
          } else if (play.timestamp && typeof play.timestamp === 'object' && '_seconds' in play.timestamp) {
            playTimestamp = (play.timestamp as any)._seconds * 1000;
          } else {
            playTimestamp = new Date(play.timestamp).getTime();
          }
          
          // Debug first few plays
          if (playIndex < 3) {
            console.log(`📍 Play ${playIndex}: ${play.text.substring(0, 50)}...`);
            console.log(`  ⏰ Play time: ${new Date(playTimestamp).toISOString()} (${playTimestamp})`);
            console.log(`  🔒 Lock time: ${new Date(activePeriods[0].start).toISOString()} (${activePeriods[0].start})`);
            console.log(`  ⏱️ Time diff: ${(playTimestamp - activePeriods[0].start) / 1000} seconds`);
          }
          
          // Check if play occurred during any of the player's active periods
          const playDuringActivePeriod = activePeriods.some(period => {
            const afterStart = playTimestamp >= period.start;
            const beforeEnd = !period.end || playTimestamp <= period.end;
            return afterStart && beforeEnd;
          });
          
          if (playDuringActivePeriod) {
            scores[player.id]++;
            playsCounted++;
          } else {
            playsSkipped++;
          }
        }
      });
      
      console.log(`✅ ${player.displayName}: ${scores[player.id]} pts (involved in ${playsInvolved} plays, ${playsCounted} counted, ${playsSkipped} skipped by time filter)`);

    });

    console.log('📊 Final YourPicks scores:', scores);
    console.log('🕐 Current time:', new Date().toISOString(), `(${Date.now()})`);
    setCurrentSetScores(scores);
  }, [playLog, selectedPlayers, homeTeamId, awayTeamId]);

  // Calculate scores for all roster players
  useEffect(() => {
    if (homeRoster.length === 0 && awayRoster.length === 0) {
      return;
    }

    const allPlayers = [...homeRoster, ...awayRoster];
    const scores: Record<string, number> = {};

    allPlayers.forEach(player => {
      scores[player.id] = 0;
      
      playLog.forEach(play => {
        if (play.athletesInvolved) {
          play.athletesInvolved.forEach(athlete => {
            if (athlete.id === player.id) {
              scores[player.id]++;
            }
          });
        }
      });
    });

    setAllPlayerScores(scores);
  }, [playLog, homeRoster, awayRoster]);

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
        playerHistory: playerHistory
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
  const currentTeamLogo = activeTeam === 'home' ? homeTeamLogo : awayTeamLogo;

  if (loading) {
    return <LoadingFootball message="Loading players..." />;
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
            <div className="border-t-2 border-[#00ffe7]/20"></div>
            
            <div className="flex items-center justify-between py-2 pr-2 border-b border-[#00ffe7]/10 mx-2 min-h-[76px]">
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
                <div className="text-[#00ffe7] text-3xl font-bold leading-tight">{totalScore + Object.values(currentSetScores).reduce((sum, score) => sum + score, 0)}</div>
                <div className="text-[#b0b7bf] text-xs">Total pts</div>
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
                <div className="text-[#b0b7bf] text-xs mb-2 font-bold h-[20px] flex items-center">
                  {isLocked ? (
                    <div className="flex items-center gap-2">
                      🔒 Locked
                    </div>
                  ) : (
                    'CURRENT'
                  )}
                </div>
                <div className="space-y-2">
                  {[...Array(5)].map((_, idx) => {
                    const player = selectedPlayers[idx];
                    if (!player) {
                      return (
                        <div
                          key={`empty-current-${idx}`}
                          className="bg-[#181a23]/50 rounded-lg p-4 border border-dashed border-[#00ffe7]/20 flex items-center gap-4 h-[72px]"
                        >
                          <div className="w-7 h-6 rounded-full bg-[#00ffe7]/20 text-[#00ffe7] font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div className="text-[#b0b7bf] text-sm">Empty Slot</div>
                        </div>
                      );
                    }

                    const headshotUrl = typeof player.headshot === 'string' ? player.headshot : player.headshot?.href;
                    const playerScore = currentSetScores[player.id] || 0;
                    const teamLogo = player.team?.logo || (player.team?.logos && player.team.logos.length > 0 ? player.team.logos[0].href : null);
                    // Check if THIS specific pick is being replaced by checking if there's a new pick at this index
                    const isBeingReplaced = isAnimating && newPicks[idx] && newPicks[idx].id !== player.id;
                    const isExpanded = expandedCardIndex === idx;
                    
                    return (
                      <div
                        key={player.id}
                        onMouseDown={() => setExpandedCardIndex(idx)}
                        onMouseUp={() => setExpandedCardIndex(null)}
                        onMouseLeave={() => setExpandedCardIndex(null)}
                        onTouchStart={() => setExpandedCardIndex(idx)}
                        onTouchEnd={() => setExpandedCardIndex(null)}
                        className={`relative overflow-hidden bg-[#181a23]/90 rounded-lg p-4 border border-[#00ffe7]/30 flex items-center gap-4 h-[72px] transition-all duration-300 cursor-pointer hover:border-[#00ffe7]/60 ${
                          isBeingReplaced ? 'opacity-0' : 'opacity-100'
                        }`}
                        style={{
                          marginBottom: '8px',
                          zIndex: isExpanded ? 10 : 1,
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
                            className="w-12 h-12 rounded-full object-cover border-2 border-[#00ffe7]/50 flex-shrink-0 relative z-10"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                              const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-12 h-12 rounded-full bg-[#23263a] border-2 border-[#00ffe7]/50 flex items-center justify-center flex-shrink-0 relative z-10"
                          style={{ display: headshotUrl ? 'none' : 'flex' }}
                        >
                          <FaUsers className="text-[#00ffe7] text-sm" />
                        </div>
                        <div className="flex-1 min-w-0 relative z-10">
                          <div className={`text-white font-bold text-sm transition-all duration-300 ${
                            isExpanded ? 'whitespace-normal' : 'whitespace-nowrap overflow-hidden text-ellipsis'
                          }`}>
                            {isExpanded ? player.fullName || player.displayName : player.displayName}
                          </div>
                          <div className="text-[#00ffe7] text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                            {typeof player.position === 'string' ? player.position : player.position?.abbreviation}{player.jersey && ` • #${player.jersey}`}
                          </div>
                        </div>
                        
                        {/* Score - Show when expanded, or when locked/roster closed with stats */}
                        {(isExpanded || ((isLocked || !isRosterOpen) && showStats)) && (
                          <div 
                            className={`text-center transition-all duration-300 relative z-10 ${
                              isExpanded || showStats ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                            }`}
                            style={{ 
                              transitionDelay: isExpanded ? '0ms' : `${idx * 100}ms`,
                              transformOrigin: 'center',
                            }}
                          >
                            <div className="text-2xl font-bold text-[#00ffe7]">{playerScore}</div>
                            <div className="text-[#b0b7bf] text-[10px]">PTS</div>
                          </div>
                        )}
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
                    ? 'bg-gradient-to-r from-[#faafe8]/10 to-[#faafe8]/5 border-2 border-[#faafe8]/30 text-[#faafe8] hover:border-[#faafe8]/50' 
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
                  ? 'bg-[#00ffe7]/20 border-[#00ffe7]/50 text-[#00ffe7]'
                  : 'bg-[#181a23] border-[#00ffe7]/20 text-gray-400 hover:border-[#00ffe7]/30'
                }`}
                >
                {homeTeamLogo && <img src={homeTeamLogo} alt="" className="w-7 h-6" />}
                {homeTeamInfo.name}
                </button>
              <button
                onClick={() => setActiveTeam('away')}
                className={`flex-1 py-3 rounded-tr-[5px] font-bold flex items-center justify-center gap-2 transition-all border ${
                  activeTeam === 'away'
                    ? 'bg-[#00ffe7]/20 border-[#00ffe7]/50 text-[#00ffe7]'
                    : 'bg-[#181a23] border-[#00ffe7]/20 text-gray-400 hover:border-[#00ffe7]/30'
                }`}
              >
                {awayTeamLogo && <img src={awayTeamLogo} alt="" className="w-7 h-6" />}
                {awayTeamInfo.name}
              </button>
            </div>

            {/* Player List */}
            <div className="bg-[#181a23]/90 rounded-b-lg py-4 mx-2">

              
              {/* Split into Offense and Defense columns */}
              <div className="grid grid-cols-2 gap-2">
                {/* Offense Column */}
                <div>
                  <h5 className="text-[#faafe8] font-bold text-sm mb-2">OFFENSE</h5>
                  <div className="space-y-2">
                    {currentRoster.filter(player => {
                      const pos = typeof player.position === 'string' ? player.position : player.position?.abbreviation;
                      return ['QB', 'RB', 'WR', 'TE', 'FB', 'OL', 'OT', 'OG', 'C'].includes(pos);
                    }).sort((a, b) => (allPlayerScores[b.id] || 0) - (allPlayerScores[a.id] || 0)).map((player) => {
                      const playerScore = allPlayerScores[player.id] || 0;
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
                              ? 'bg-gray-700/20 border border-gray-600/50 opacity-50 cursor-not-allowed'
                              : isInNew
                              ? 'bg-[#00ffe7]/20 border border-[#00ffe7]/60'
                              : 'bg-[#23263a]/50 border border-transparent hover:border-[#00ffe7]/30 cursor-pointer'
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
                          {playerScore > 0 && (
                            <div className="text-right flex-shrink-0">
                              <div className="text-[#00ffe7] font-bold text-sm">{playerScore}</div>
                              <div className="text-[#b0b7bf] text-[9px]">pts</div>
                            </div>
                          )}
                          {isInNew && <FaCheckCircle className="text-[#00ffe7] flex-shrink-0 text-xs ml-2" />}
                          {isDuplicate && <FaLock className="text-gray-500 flex-shrink-0 text-xs ml-2" />}
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
                    }).sort((a, b) => (allPlayerScores[b.id] || 0) - (allPlayerScores[a.id] || 0)).map((player) => {
                      const playerScore = allPlayerScores[player.id] || 0;
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
                              ? 'bg-gray-700/20 border border-gray-600/50 opacity-50 cursor-not-allowed'
                              : isInNew
                              ? 'bg-[#00ffe7]/20 border border-[#00ffe7]/60'
                              : 'bg-[#23263a]/50 border border-transparent hover:border-[#00ffe7]/30 cursor-pointer'
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
                          {playerScore > 0 && (
                            <div className="text-right flex-shrink-0">
                              <div className="text-[#00ffe7] font-bold text-sm">{playerScore}</div>
                              <div className="text-[#b0b7bf] text-[9px]">pts</div>
                            </div>
                          )}
                          {isInNew && <FaCheckCircle className="text-[#00ffe7] flex-shrink-0 text-xs ml-2" />}
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
};

export default YourPicks;
