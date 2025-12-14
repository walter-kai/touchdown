import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Team {
  id: string;
  team: {
    displayName: string;
    abbreviation: string;
  };
  score?: string;
  records?: Array<{ summary: string }>;
}

interface Competition {
  status: {
    type: {
      state: string;
    };
    period: number;
    displayClock: string;
  };
  situation?: {
    downDistanceText?: string;
    possession?: string;
  };
}

interface BoxscoreProps {
  homeTeam: Team | undefined;
  awayTeam: Team | undefined;
  competition: Competition;
  getTeamLogo: (team: any) => string;
  gameCountdown?: number;
  gameDate?: string;
}

const Boxscore: React.FC<BoxscoreProps> = ({
  homeTeam,
  awayTeam,
  competition,
  getTeamLogo,
  gameCountdown = 0,
  gameDate,
}) => {
  const navigate = useNavigate();

  return (
    <div>
      {/* 2x2 Grid for Game Info */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Date & Time */}
        <div className="bg-[#181a23]/50 rounded-lg p-4 border border-[#00ffe7]/20">
          <p className="text-[#b0b7bf] text-xs mb-1">Game Date</p>
          {gameDate ? (
            <p className="text-[#00ffe7] font-bold text-lg">
              {new Date(gameDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          ) : (
            <p className="text-[#e0e7ef] text-sm">-</p>
          )}
        </div>

        {/* Game Status */}
        <div className="bg-[#181a23]/50 rounded-lg p-4 border border-[#00ffe7]/20">
          <p className="text-[#b0b7bf] text-xs mb-1">{competition.status.type.state === 'pre' ? 'Starts In' : 'Status'}</p>
          {competition.status.type.state === 'in' ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-red-500 font-bold text-lg">LIVE</span>
              <span className="text-[#e0e7ef] font-bold">Q{competition.status.period} - {competition.status.displayClock}</span>
            </div>
          ) : competition.status.type.state === 'post' ? (
            <span className="text-[#b0b7bf] font-bold text-lg">FINAL</span>
          ) : (
            <div>
              <span className="text-[#e0e7ef] font-bold text-lg">
                {(() => {
                  const days = Math.floor(gameCountdown / (1000 * 60 * 60 * 24));
                  const hours = Math.floor((gameCountdown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                  const minutes = Math.floor((gameCountdown % (1000 * 60 * 60)) / (1000 * 60));
                  const seconds = Math.floor((gameCountdown % (1000 * 60)) / 1000);
                  
                  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
                  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
                  if (minutes > 0) return `${minutes}m ${seconds}s`;
                  return `${seconds}s`;
                })()}
              </span>
            </div>
          )}
        </div>

        {/* Down & Distance - Only show for live games */}
        {competition.status.type.state === 'in' && (
          <div className="bg-[#181a23]/50 rounded-lg p-4 border border-[#faafe8]/20">
            <p className="text-[#b0b7bf] text-xs mb-1">Down & Distance</p>
            {competition.situation?.downDistanceText ? (
              <p className="text-[#faafe8] font-bold text-lg">{competition.situation.downDistanceText}</p>
            ) : (
              <p className="text-[#e0e7ef] text-sm">-</p>
            )}
          </div>
        )}

        {/* Possession - Only show for live games */}
        {competition.status.type.state === 'in' && (
          <div className="bg-[#181a23]/50 rounded-lg p-4 border border-[#00ffe7]/20">
            <p className="text-[#b0b7bf] text-xs mb-1">Possession</p>
            {competition.situation?.possession ? (
              <div className="flex items-center gap-2">
                <img
                  src={competition.situation.possession === homeTeam?.id ? getTeamLogo(homeTeam?.team) : getTeamLogo(awayTeam?.team)}
                  alt="Possession"
                  className="w-8 h-8"
                />
                <p className="text-[#00ffe7] font-bold text-lg">
                  {competition.situation.possession === homeTeam?.id ? homeTeam?.team.abbreviation : awayTeam?.team.abbreviation}
                </p>
              </div>
            ) : (
              <p className="text-[#e0e7ef] text-sm">-</p>
            )}
          </div>
        )}
      </div>

      {/* Team Scores */}
      <div className="border border-[#00ffe7]/30 rounded-lg bg-[#181a23]/30">
        <div className="flex items-center justify-between">
          {/* Away Team */}
          <button
            onClick={() => awayTeam?.id && navigate(`/nfl/team/${awayTeam.id}`)}
            className="flex flex-col items-center hover:bg-[#00ffe7]/10 active:bg-[#00ffe7]/20 rounded-lg py-3 transition-all group cursor-pointer flex-1 focus:outline-none"
          >
            <img
              src={getTeamLogo(awayTeam?.team)}
              alt={awayTeam?.team?.displayName}
              className="w-20 h-20 md:w-20 md:h-20 mb-2 group-hover:scale-110 transition-transform"
            />
            <h2 className="text-[#e0e7ef] font-bold text-sm md:text-base text-center px-2 group-hover:text-[#00ffe7] transition-colors">
              {awayTeam?.team?.displayName}
            </h2>
            <p className="text-[#b0b7bf] text-xs">{awayTeam?.records?.[0]?.summary}</p>
          </button>

          {/* Center Scores */}
          <div className="flex items-center gap-4 px-6">
            <p className="text-[#00ffe7] text-4xl md:text-5xl font-bold">{awayTeam?.score || '0'}</p>
            <span className="text-[#b0b7bf] text-2xl">-</span>
            <p className="text-[#00ffe7] text-4xl md:text-5xl font-bold">{homeTeam?.score || '0'}</p>
          </div>

          {/* Home Team */}
          <button
            onClick={() => homeTeam?.id && navigate(`/nfl/team/${homeTeam.id}`)}
            className="flex flex-col items-center hover:bg-[#00ffe7]/10 active:bg-[#00ffe7]/20 rounded-lg py-3 transition-all group cursor-pointer flex-1 focus:outline-none"
          >
            <img
              src={getTeamLogo(homeTeam?.team)}
              alt={homeTeam?.team?.displayName}
              className="w-20 h-20 md:w-20 md:h-20 mb-2 group-hover:scale-110 transition-transform"
            />
            <h2 className="text-[#e0e7ef] font-bold text-sm md:text-base text-center px-2 group-hover:text-[#00ffe7] transition-colors">
              {homeTeam?.team?.displayName}
            </h2>
            <p className="text-[#b0b7bf] text-xs">{homeTeam?.records?.[0]?.summary}</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Boxscore;