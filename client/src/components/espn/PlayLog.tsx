import React, { useState, useEffect, useRef } from 'react';
import { Play } from '@/types/espn/playByplay';
import { usePlays } from '@/providers/PlaysContext';

interface PlayLogProps {
  playLog: Play[];
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
  selectedPlayers?: Array<{ id: string }>;
  title?: string;
  showTitle?: boolean;
  maxHeight?: string;
  countdown?: number;
}

const PlayLog: React.FC<PlayLogProps> = ({
  playLog,
  homeTeam,
  awayTeam,
  getTeamLogo,
  selectedPlayers = [],
  title = 'Play Log',
  showTitle = true,
  maxHeight = 'none',
  countdown = 30
}) => {
  const { playLog: contextPlayLog = [], countdown: contextCountdown, isRefreshing, refresh } = usePlays();
  const resolvedPlayLog = playLog?.length ? playLog : contextPlayLog;
  const REFRESH_TOTAL_SECONDS = 30;
  const effectiveCountdown = contextCountdown ?? countdown;
  const remainingSeconds = Math.max(0, Math.ceil(effectiveCountdown ?? REFRESH_TOTAL_SECONDS));
  const progress = Math.max(0, Math.min(100, ((effectiveCountdown ?? REFRESH_TOTAL_SECONDS) / REFRESH_TOTAL_SECONDS) * 100));
  const [newPlayIds, setNewPlayIds] = useState<Set<string>>(new Set());
  const prevPlayCountRef = useRef(resolvedPlayLog.length);
  const hasRefreshedInitially = useRef(false);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  // Trigger an initial refresh on mount so the countdown follows a fresh fetch
  useEffect(() => {
    if (!refresh || hasRefreshedInitially.current) return;
    hasRefreshedInitially.current = true;
    Promise.resolve(refresh()).catch(err => console.error('Initial play log refresh failed', err));
  }, [refresh]);

  // Track lock countdown ticks
  useEffect(() => {
    if (!lockUntil) return;
    const tick = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(tick);
  }, [lockUntil]);

  useEffect(() => {
    if (lockUntil && now >= lockUntil) {
      setLockUntil(null);
    }
  }, [lockUntil, now]);

  // Track new plays for animation
  useEffect(() => {
    if (resolvedPlayLog.length > prevPlayCountRef.current) {
      // New plays were added
      const newIds = new Set<string>();
      const numNewPlays = resolvedPlayLog.length - prevPlayCountRef.current;
      
      // Mark the first N plays as new (they're added at the beginning)
      for (let i = 0; i < numNewPlays; i++) {
        const play = resolvedPlayLog[i];
        const playId = `${play.text}-${play.quarter}-${play.clock}`;
        newIds.add(playId);
      }
      
      setNewPlayIds(newIds);
      
      // Remove the "new" marker after animation completes
      setTimeout(() => {
        setNewPlayIds(new Set());
      }, 1000);
    }
    
    prevPlayCountRef.current = resolvedPlayLog.length;
  }, [resolvedPlayLog]);

  const lockRemaining = lockUntil ? Math.max(0, Math.ceil((lockUntil - now) / 1000)) : 0;
  const isLocked = lockRemaining > 0;

  const handleManualRefresh = async () => {
    if (!refresh || isLocked || isRefreshing) return;
    setLockUntil(Date.now() + 30000);
    try {
      await refresh();
    } catch (err) {
      // Swallow to avoid UI interruption; the next auto refresh will recover
      console.error('Manual refresh failed', err);
    }
  };

  if (resolvedPlayLog.length === 0) {
    return (
      <div className="text-text-muted text-center py-8">
        No plays recorded yet
      </div>
    );
  }

  // Group plays by possession with better logic
  const groupedPlays: Array<{
    possession: string | undefined;
    team: any;
    plays: typeof resolvedPlayLog;
  }> = [];
  
  resolvedPlayLog.forEach((play, idx) => {
    const team = play.possession === homeTeam?.id ? homeTeam : awayTeam;
    const lastGroup = groupedPlays[groupedPlays.length - 1];
    
    // Group if same possession OR if both are undefined/null (same team)
    const isSamePossession = lastGroup && (
      (lastGroup.possession === play.possession && play.possession !== undefined) ||
      (lastGroup.team?.id === team?.id && (!lastGroup.possession || !play.possession))
    );
    
    if (isSamePossession) {
      lastGroup.plays.push(play);
    } else {
      groupedPlays.push({
        possession: play.possession,
        team,
        plays: [play]
      });
    }
  });

  return (
    <div>
      {showTitle && (
        <>
          {/* Divider */}
          <div className="border-t-2 border-neon-cyan/20"></div>
          
          <div className="flex items-center justify-between pt-2 pr-2 ">
            <div>
              <h1>
                {title}
              </h1>
            </div>
            
            <div className="text-right min-w-[120px] h-[60px] flex flex-col justify-center">
              <div className="text-neon-cyan text-3xl font-bold leading-tight">{resolvedPlayLog.length}</div>
              <div className="text-text-muted text-xs">{resolvedPlayLog.length === 1 ? 'play' : 'plays'}</div>
            </div>
          </div>

          {/* Loading Bar */}
          <div className="mx-2 mb-4">
            <div className="flex items-center gap-3">
                              <div
                              className={`py-1 text-[11px] font-semibold transition-all ${
                                (!refresh || isRefreshing || isLocked)
                                ? 'opacity-60 border-white/20 text-white/50'
                                : 'border-neon-cyan text-neon-cyan'
                              }`}
                              >
                              {isRefreshing ? 'Refreshing…' : isLocked ? `${lockRemaining}s` : `Refresh (${remainingSeconds}s)`}
                              </div>
              <div className="flex-1">
                <div className="h-1 bg-bg-darker rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-neon-cyan to-neon-pink transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(0,255,231,0.5)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

            </div>
          </div>
        </>
      )}

      <div className="space-y-3" style={{ maxHeight, overflowY: maxHeight !== 'none' ? 'auto' : 'visible' }}>
        {groupedPlays.map((group, groupIdx) => {
          const isHome = group.team?.id === homeTeam?.id;
          const borderColor = isHome ? 'border-neon-pink' : 'border-neon-cyan';
          const bgGradient = isHome ? 'from-neon-pink/10' : 'from-neon-cyan/10';
          const textColor = isHome ? 'text-neon-pink' : 'text-neon-cyan';

          // Check if this is a new group (first play is new)
          const firstPlayId = `${group.plays[0].text}-${group.plays[0].quarter}-${group.plays[0].clock}`;
          const isNewGroup = newPlayIds.has(firstPlayId);

          return (
            <div
              key={`possession-${groupIdx}`}
              className={`p-3 bg-gradient-to-r ${bgGradient} border-l-4 ${borderColor} rounded-lg ${
                isNewGroup ? 'animate-slide-in-play' : ''
              }`}
              style={{
                animationDelay: isNewGroup ? `${groupIdx * 50}ms` : '0ms'
              }}
            >
              {/* Possession Header - shown once per group */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  {group.team && getTeamLogo && (
                    <img
                      src={getTeamLogo(group.team.team)}
                      alt={group.team.team.displayName}
                      className="w-8 h-7"
                    />
                  )}
                  <span className={`${textColor} text-sm font-bold`}>
                    {group.team?.team.displayName || 'Unknown'}
                  </span>
                </div>
                <span className="text-text-muted text-xs">
                  {group.plays.length} {group.plays.length === 1 ? 'play' : 'plays'}
                </span>
              </div>

              {/* Plays in this possession */}
              <div className="space-y-3">
                {group.plays.map((play, playIdx) => {
                  // Normalize participant list to avoid null/undefined entries from API
                  const participants = (play.athletesInvolved || []).filter(Boolean);
                  const primaryAthlete = participants.length > 0 ? participants[0] : null;
                  const headshots = participants.filter(a => a.headshot).slice(0, 4);
                  const isSelected = selectedPlayers.some(p => p.id === primaryAthlete?.id);
                       const typeText = typeof play.type === 'string' ? play.type : (play.type as any)?.text || (play.type as any)?.displayName || '';
                       const participantCountLabel = (() => {
                         const count = headshots.length || participants.length;
                         if (count === 1) return '1 player involved';
                         if (count > 1) return `${count} players involved`;
                         return '';
                       })();
                  const playId = `${play.text}-${play.quarter}-${play.clock}`;
                  const isNewPlay = newPlayIds.has(playId);

                  return (
                    <div 
                      key={`play-${groupIdx}-${playIdx}`} 
                      className={`space-y-2 ${isNewPlay ? 'animate-fade-in-scale' : ''}`}
                      style={{
                        animationDelay: isNewPlay ? `${(groupIdx * 50) + (playIdx * 100)}ms` : '0ms'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className={`text-sm text-neon-cyan font-bold'}`}>
                            {typeText || 'Play'}
                          </span>
                          {participantCountLabel && (
                            <span className="text-text-muted text-[11px] font-semibold pl-2">
                              {participantCountLabel}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-end">
                            {headshots.map((athlete, idx) => (
                              <img
                                key={athlete.id || idx}
                                src={athlete.headshot}
                                alt={athlete.shortName || athlete.displayName}
                                className={`w-10 h-10 rounded-full border-2 object-cover ${
                                  selectedPlayers.some(p => p.id === athlete.id) ? 'border-neon-cyan' : 'border-white/30'
                                }`}
                                style={{ marginLeft: idx === 0 ? 0 : -8, zIndex: 20 - idx }}
                              />
                            ))}
                            <span className={`${textColor} text-xs font-bold pl-2`}>
                              Q{play.quarter} - {play.clock}
                            </span>
                          </div>

                        </div>
                      </div>
                          <p className="text-text-light text-sm leading-snug pl-0">
                            {play.text}
                          </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayLog;
