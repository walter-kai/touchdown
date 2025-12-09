import React from 'react';
import { FaFootballBall } from 'react-icons/fa';

interface AthleteInvolved {
  id: string;
  fullName: string;
  displayName: string;
  shortName: string;
  headshot: string;
  jersey: string;
  position: string;
  team: { id: string };
}

interface PlayLogEntry {
  text: string;
  quarter: number;
  clock: string;
  yardage?: number;
  timestamp: Date;
  possession?: string;
  athletesInvolved?: AthleteInvolved[];
}

interface SituationProps {
  situation: {
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
  homeTeam: {
    id: string;
    team: {
      displayName: string;
      abbreviation: string;
      logo?: string;
      logos?: Array<{ href: string }>;
    };
  };
  awayTeam: {
    id: string;
    team: {
      displayName: string;
      abbreviation: string;
      logo?: string;
      logos?: Array<{ href: string }>;
    };
  };
  playLog: PlayLogEntry[];
  getTeamLogo: (team: any) => string;
}

const Situation: React.FC<SituationProps> = ({
  situation,
  homeTeam,
  awayTeam,
  playLog,
  getTeamLogo
}) => {
  if (!situation || !situation.lastPlay) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <p>No game situation available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Drive Info */}
      <div className="">
        {/* Down & Distance + Possession - Side by Side */}
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* Down & Distance */}
          {situation.downDistanceText && (
            <div className="flex-1 text-center">
              <p className="text-[#b0b7bf] text-xs mb-2">Down & Distance</p>
              <p className="text-[#faafe8] font-bold text-xl">{situation.downDistanceText}</p>
            </div>
          )}
          
          {/* Possession */}
          <div className="flex-1 text-center">
            <p className="text-[#b0b7bf] text-xs mb-2">Possession</p>
            <div className="flex items-center justify-center gap-2">
              <img
                src={situation.possession === homeTeam?.id ? getTeamLogo(homeTeam?.team) : getTeamLogo(awayTeam?.team)}
                alt="Possession"
                className="w-10 h-10"
              />
              <p className="text-[#00ffe7] font-bold text-xl">
                {situation.possession === homeTeam?.id ? homeTeam?.team.abbreviation : awayTeam?.team.abbreviation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Field Visualization */}
      <div className="border-t border-[#00ffe7]/10 pt-6 mb-6">
        {/* Football Field */}
        <div className="relative w-full bg-gradient-to-b from-green-700 to-green-800 rounded-lg overflow-hidden" style={{ height: '200px' }}>
          {/* End zones - 10% each */}
          <div className="absolute left-0 top-0 bottom-0 w-[10%] bg-blue-900/40 flex items-center justify-center">
            <img src={getTeamLogo(awayTeam?.team)} alt="" className="w-12 h-12 opacity-60" />
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-[10%] bg-red-900/40 flex items-center justify-center">
            <img src={getTeamLogo(homeTeam?.team)} alt="" className="w-12 h-12 opacity-60" />
          </div>

          {/* Playing field - 80% between end zones */}
          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((fieldPercent) => {
            const actualPosition = 10 + (fieldPercent * 0.8);
            const yardNumber = fieldPercent <= 50 ? fieldPercent : 100 - fieldPercent;
            
            return (
              <div
                key={fieldPercent}
                className="absolute top-0 bottom-0 border-l border-white/20"
                style={{ left: `${actualPosition}%` }}
              >
                {fieldPercent % 10 === 0 && (
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-white/40 text-xs font-bold">
                    {yardNumber}
                  </div>
                )}
              </div>
            );
          })}

          {/* 50 yard line highlight */}
          <div className="absolute top-0 bottom-0 left-[50%] w-0.5 bg-yellow-400/30" />

          {/* Start position */}
          {situation.lastPlay.start && (
            <div
              className="absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${10 + (situation.lastPlay.start.yardLine * 0.8)}%` }}
            >
              <div className="w-3 h-3 rounded-full bg-yellow-400 border-2 border-white shadow-lg" />
            </div>
          )}

          {/* End position with player headshot */}
          {situation.lastPlay.end && situation.lastPlay.athletesInvolved && situation.lastPlay.athletesInvolved.length > 0 && (
            <div
              className="absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${10 + (situation.lastPlay.end.yardLine * 0.8)}%` }}
            >
              <div className="relative group">
                <div className="w-20 h-16 rounded-full bg-yellow-400/30 flex items-center justify-center border-4 border-yellow-400 shadow-2xl shadow-yellow-400/50">
                  <img
                    src={situation.lastPlay.athletesInvolved[0].headshot}
                    alt={situation.lastPlay.athletesInvolved[0].displayName}
                    className="w-14 h-14 rounded-full object-cover z-1"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = 'flex items-center justify-center';
                        fallback.innerHTML = '<span class="text-[#00ffe7] font-bold text-xs">⬇️</span>';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
                {/* Player name tooltip */}
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-[#23263a] border border-[#00ffe7]/50 rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <p className="text-[#00ffe7] text-xs font-bold">{situation.lastPlay.athletesInvolved[0].displayName}</p>
                  <p className="text-[#b0b7bf] text-xs">{situation.lastPlay.athletesInvolved[0].position}</p>
                </div>
              </div>
            </div>
          )}

          {/* Arrow showing play direction */}
          {situation.lastPlay.start && situation.lastPlay.end && (
            <svg
              className="absolute top-1/2 left-0 w-full h-full pointer-events-none z-0"
              style={{ transform: 'translateY(-50%)' }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="8"
                  refY="2"
                  orient="auto"
                >
                  <polygon points="0 0, 8 2, 0 4" fill="#00ffe7" />
                </marker>
              </defs>
              <line
                x1={`${10 + (situation.lastPlay.start.yardLine * 0.8)}%`}
                y1="50%"
                x2={`${10 + (situation.lastPlay.end.yardLine * 0.8)}%`}
                y2="50%"
                stroke="#00ffe7"
                strokeWidth="3"
                markerEnd="url(#arrowhead)"
                opacity="0.7"
              />
            </svg>
          )}
        </div>

        {/* Timeouts */}
        <div className="flex justify-between items-center pt-4">
          <div className="text-center">
            <p className="text-[#b0b7bf] text-xs mb-1">{awayTeam?.team.abbreviation} Timeouts</p>
            <div className="flex gap-1 justify-center">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3 h-3 rounded-full ${
                    i < ((situation?.awayTimeouts ?? 3)) 
                      ? 'bg-[#00ffe7]' 
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-[#b0b7bf] text-xs mb-1">{homeTeam?.team.abbreviation} Timeouts</p>
            <div className="flex gap-1 justify-center">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3 h-3 rounded-full ${
                    i < ((situation?.homeTimeouts ?? 3)) 
                      ? 'bg-[#faafe8]' 
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Latest Play */}
        {playLog.length > 0 && (() => {
          const latestPlay = playLog[0];
          const team = latestPlay.possession === homeTeam?.id ? homeTeam : awayTeam;
          const isHome = team?.id === homeTeam?.id;

          return (
            <div className="mt-4">
              <div className="text-[#b0b7bf] text-xs mb-2 flex items-center gap-2">
                <FaFootballBall className="text-[#00ffe7]" />
                Latest Play
              </div>
              <div className={`bg-gradient-to-r ${isHome ? 'from-[#faafe8]/10' : 'from-[#00ffe7]/10'} rounded-lg p-3 border-l-2 ${isHome ? 'border-[#faafe8]' : 'border-[#00ffe7]'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <img src={getTeamLogo(team?.team)} alt="" className="w-5 h-5" />
                  <span className={`text-xs font-bold ${isHome ? 'text-[#faafe8]' : 'text-[#00ffe7]'}`}>
                    Q{latestPlay.quarter} {latestPlay.clock}
                  </span>
                </div>
                
                {/* Player headshots */}
                {latestPlay.athletesInvolved && latestPlay.athletesInvolved.length > 0 && (
                  <div className="flex gap-2 mb-2">
                    {latestPlay.athletesInvolved.slice(0, 3).map((athlete, idx) => (
                      athlete.headshot && (
                        <div key={idx} className="flex items-center gap-1">
                          <img
                            src={athlete.headshot}
                            alt={athlete.displayName}
                            className="w-8 h-8 rounded-full border-2 border-[#00ffe7]/30"
                          />
                          <div className="flex flex-col">
                            <span className="text-[#e0e7ef] text-xs font-semibold">{athlete.shortName}</span>
                            <span className="text-[#b0b7bf] text-[10px]">{athlete.position}</span>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}
                
                <p className="text-[#e0e7ef] text-xs">
                  {latestPlay.text}
                </p>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default Situation;
