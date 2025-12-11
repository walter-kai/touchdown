import React from 'react';
import { FaFootballBall, FaListUl } from 'react-icons/fa';

interface PlayLogProps {
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
}

const PlayLog: React.FC<PlayLogProps> = ({
  playLog,
  homeTeam,
  awayTeam,
  getTeamLogo,
  selectedPlayers = [],
  title = 'Play Log',
  showTitle = true,
  maxHeight = 'none'
}) => {
  if (playLog.length === 0) {
    return (
      <div className="text-[#b0b7bf] text-center py-8">
        No plays recorded yet
      </div>
    );
  }

  // Group plays by possession with better logic
  const groupedPlays: Array<{
    possession: string | undefined;
    team: any;
    plays: typeof playLog;
  }> = [];
  
  playLog.forEach((play, idx) => {
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
          <div className="border-t-2 border-[#00ffe7]/20"></div>
          
          <div className="flex items-center justify-between py-2 pr-2 border-b border-[#00ffe7]/10 mx-2 min-h-[76px]">
            <div>
              <h4 className="font-bold text-2xl uppercase tracking-wide text-[#00ffe7]">
                {title}
              </h4>
            </div>
            
            <div className="text-right min-w-[120px] h-[60px] flex flex-col justify-center">
              <div className="text-[#00ffe7] text-3xl font-bold leading-tight">{playLog.length}</div>
              <div className="text-[#b0b7bf] text-xs">{playLog.length === 1 ? 'play' : 'plays'}</div>
            </div>
          </div>
        </>
      )}

      <div className="space-y-3" style={{ maxHeight, overflowY: maxHeight !== 'none' ? 'auto' : 'visible' }}>
        {groupedPlays.map((group, groupIdx) => {
          const isHome = group.team?.id === homeTeam?.id;
          const borderColor = isHome ? 'border-[#faafe8]' : 'border-[#00ffe7]';
          const bgGradient = isHome ? 'from-[#faafe8]/10' : 'from-[#00ffe7]/10';
          const textColor = isHome ? 'text-[#faafe8]' : 'text-[#00ffe7]';

          return (
            <div
              key={`possession-${groupIdx}`}
              className={`p-3 bg-gradient-to-r ${bgGradient} border-l-4 ${borderColor} rounded-lg`}
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
                <span className="text-[#b0b7bf] text-xs">
                  {group.plays.length} {group.plays.length === 1 ? 'play' : 'plays'}
                </span>
              </div>

              {/* Plays in this possession */}
              <div className="space-y-3">
                {group.plays.map((play, playIdx) => {
                  const primaryAthlete = play.athletesInvolved && play.athletesInvolved.length > 0 ? play.athletesInvolved[0] : null;
                  const headshotUrl = primaryAthlete?.headshot;
                  const isSelected = selectedPlayers.some(p => p.id === primaryAthlete?.id);

                  return (
                    <div key={`play-${groupIdx}-${playIdx}`} className="space-y-2">
                      {/* Player Header with Large Headshot */}
                      {headshotUrl && primaryAthlete && (
                        <div className="flex items-center gap-3">
                          <img
                            src={headshotUrl}
                            alt={primaryAthlete.displayName}
                            className={`rounded-lg object-cover border-2 flex-shrink-0 ${
                              isSelected ? 'border-[#00ffe7]' : 'border-white/30'
                            }`}
                            style={{ width: '69px', height: '60px' }}
                          />
                          <div className="flex-1">
                            <div className={`font-bold ${isSelected ? 'text-[#00ffe7]' : 'text-white'}`}>
                              {primaryAthlete.displayName}
                            </div>
                            <div className="text-[#b0b7bf] text-xs">
                              {primaryAthlete.position} • #{primaryAthlete.jersey}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`${textColor} text-xs font-bold`}>
                              Q{play.quarter} - {play.clock}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Play without primary athlete */}
                      {!headshotUrl && (
                        <div className="flex items-center justify-between mb-1">
                          <span className={`${textColor} text-xs font-bold`}>
                            Q{play.quarter} - {play.clock}
                          </span>
                        </div>
                      )}

                      {/* Play Description */}
                      <p className="text-[#e0e7ef] text-sm leading-snug pl-0">
                        {play.text}
                      </p>

                      {/* Additional Athletes Involved */}
                      {play.athletesInvolved && play.athletesInvolved.length > 1 && (
                        <div className="flex flex-wrap gap-2">
                          {play.athletesInvolved.slice(1).map((athlete, aIdx) => {
                            const isAthleteSelected = selectedPlayers.some(p => p.id === athlete.id);
                            return (
                              <div key={aIdx} className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                                isAthleteSelected ? 'bg-[#00ffe7]/20 border border-[#00ffe7]/50 text-[#00ffe7]' : 'bg-[#23263a]/80 text-[#b0b7bf]'
                              }`}>
                                {athlete.headshot && (
                                  <img 
                                    src={athlete.headshot} 
                                    alt={athlete.shortName} 
                                    className="w-5 h-5 rounded-full" 
                                  />
                                )}
                                <span>{athlete.shortName}</span>
                                <span className="opacity-60">{athlete.position}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
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
