import React from "react";
import { useNavigate } from "react-router-dom";
import { FaFootballBall } from "react-icons/fa";
import type { Leader } from "@/types/espn/game";

interface HeadToHeadProps {
  homeTeamLeaders: Leader[];
  awayTeamLeaders: Leader[];
  homeTeamName: string;
  awayTeamName: string;
}

const HeadToHead: React.FC<HeadToHeadProps> = ({ 
  homeTeamLeaders, 
  awayTeamLeaders,
  homeTeamName,
  awayTeamName
}) => {
  const navigate = useNavigate();
  
  if (!homeTeamLeaders.length || !awayTeamLeaders.length) return null;

  return (
    <div className="space-y-3">
      <div className="text-xs sm:text-sm font-bold text-[#00ffe7] uppercase tracking-wider">
        Season Leaders - Head to Head
      </div>
      
      {homeTeamLeaders.map((homeLeader: Leader, idx: number) => {
        const homeTopLeader = homeLeader.leaders?.[0];
        if (!homeTopLeader) return null;
        
        // Find matching category in away team leaders
        const awayLeader = awayTeamLeaders.find((l: Leader) => l.name === homeLeader.name);
        const awayTopLeader = awayLeader?.leaders?.[0];
        
        return (
          <div 
            key={idx} 
            className="bg-[#181a23]/50 rounded-lg border border-[#00ffe7]/20 p-2 sm:p-3"
          >
            {/* Category Badge */}
            <div className="mb-2 text-center">
              <span className="inline-block px-2 sm:px-3 py-1 bg-[#00ffe7]/20 border border-[#00ffe7]/40 rounded-full text-[#00ffe7] text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                {homeLeader.displayName}
              </span>
            </div>
            
            {/* Head to Head Comparison */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 items-center">
              
              {/* Away Team Player (Left) */}
              {awayTopLeader ? (
                <div className="flex items-center gap-2">
                  {awayTopLeader.athlete.headshot ? (
                    <img 
                      src={awayTopLeader.athlete.headshot}
                      alt={awayTopLeader.athlete.displayName}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-[#faafe8]/50 flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
                      onClick={() => navigate(`/nfl/player/${awayTopLeader.athlete.id}`)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#23263a] border-2 border-[#faafe8]/50 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
                    style={{ display: awayTopLeader.athlete.headshot ? 'none' : 'flex' }}
                    onClick={() => navigate(`/nfl/player/${awayTopLeader.athlete.id}`)}
                  >
                    <FaFootballBall className="text-[#faafe8] text-base sm:text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div 
                      className="text-xs sm:text-sm font-bold text-white truncate cursor-pointer hover:text-[#faafe8] transition-colors"
                      onClick={() => navigate(`/nfl/player/${awayTopLeader.athlete.id}`)}
                    >
                      {awayTopLeader.athlete.displayName}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-400">
                      {awayLeader?.abbreviation}
                    </div>
                    <div className="text-sm sm:text-base font-bold text-[#faafe8]">
                      {awayTopLeader.displayValue}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center text-gray-500 text-[10px] sm:text-xs">
                  No data
                </div>
              )}
              
              {/* Home Team Player (Right) */}
              <div className="flex items-center gap-2 justify-end">
                <div className="flex-1 min-w-0 text-right">
                  <div 
                    className="text-xs sm:text-sm font-bold text-white truncate cursor-pointer hover:text-[#00ffe7] transition-colors"
                    onClick={() => navigate(`/nfl/player/${homeTopLeader.athlete.id}`)}
                  >
                    {homeTopLeader.athlete.displayName}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-400">
                    {homeLeader.abbreviation}
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[#00ffe7]">
                    {homeTopLeader.displayValue}
                  </div>
                </div>
                {homeTopLeader.athlete.headshot ? (
                  <img 
                    src={homeTopLeader.athlete.headshot}
                    alt={homeTopLeader.athlete.displayName}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-[#00ffe7]/50 flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => navigate(`/nfl/player/${homeTopLeader.athlete.id}`)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#23263a] border-2 border-[#00ffe7]/50 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
                  style={{ display: homeTopLeader.athlete.headshot ? 'none' : 'flex' }}
                  onClick={() => navigate(`/nfl/player/${homeTopLeader.athlete.id}`)}
                >
                  <FaFootballBall className="text-[#00ffe7] text-base sm:text-lg" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HeadToHead;
