import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaFootballBall } from "react-icons/fa";
import axios from "axios";
import type { Leader } from "@/types/espn/scoreboard";

interface HeadToHeadProps {
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
}

const HeadToHead: React.FC<HeadToHeadProps> = ({ 
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
}) => {
  const navigate = useNavigate();
  const [homeTeamLeaders, setHomeTeamLeaders] = useState<Leader[]>([]);
  const [awayTeamLeaders, setAwayTeamLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        setLoading(true);
        setError(null);

        const [homeResponse, awayResponse] = await Promise.all([
          axios.get(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${homeTeamId}`),
          axios.get(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${awayTeamId}`)
        ]);

        const homeLeaders = homeResponse.data.team?.nextEvent?.[0]?.competitions?.[0]?.competitors?.find(
          (c: any) => c.id === homeTeamId
        )?.leaders || [];

        const awayLeaders = awayResponse.data.team?.nextEvent?.[0]?.competitions?.[0]?.competitors?.find(
          (c: any) => c.id === awayTeamId
        )?.leaders || [];

        setHomeTeamLeaders(homeLeaders);
        setAwayTeamLeaders(awayLeaders);
      } catch (err) {
        console.error('Failed to fetch team leaders:', err);
        setError('Failed to load team leaders data');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();
  }, [homeTeamId, awayTeamId]);

  if (loading) {
    return (
      <div className="bg-[#181a23]/90 border border-[#00ffe7]/30 rounded-xl shadow-[0_0_20px_rgba(0,255,231,0.1)] p-6 text-center">
        <p className="text-[#00ffe7]">Loading head-to-head data...</p>
      </div>
    );
  }

  if (error || !homeTeamLeaders.length || !awayTeamLeaders.length) {
    return (
      <div className="bg-[#181a23]/90 border border-[#00ffe7]/30 rounded-xl shadow-[0_0_20px_rgba(0,255,231,0.1)] p-6 text-center">
        <p className="text-gray-400">{error || 'No head-to-head data available'}</p>
      </div>
    );
  }
  
  return (
    <div className="bg-[#181a23]/90 border border-[#00ffe7]/30 rounded-xl shadow-[0_0_20px_rgba(0,255,231,0.1)] p-6">
      <h3 className="text-[#00ffe7] font-bold text-2xl mb-6">
        Head to Head
      </h3>
      
      <div className="space-y-6">
        {homeTeamLeaders.map((homeLeader: Leader, idx: number) => {
          const homeTopLeader = homeLeader.leaders?.[0];
          if (!homeTopLeader) return null;
          
          // Find matching category in away team leaders
          const awayLeader = awayTeamLeaders.find((l: Leader) => l.name === homeLeader.name);
          const awayTopLeader = awayLeader?.leaders?.[0];
          
          return (
            <div 
              key={idx} 
              className="border-b border-[#00ffe7]/10 pb-4 last:border-b-0"
            >
              {/* Category Name */}
              <p className="text-[#b0b7bf] text-sm mb-3 text-center font-semibold">
                {homeLeader.displayName}
              </p>
            
            {/* Head to Head Comparison */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
              
              {/* Away Team Player (Left) */}
              {awayTopLeader ? (
                <div className="flex items-center gap-2 justify-end">
                  <div className="flex-1 min-w-0 text-right">
                    <div 
                      className="text-xs sm:text-sm font-bold text-white truncate cursor-pointer hover:text-[#faafe8] transition-colors"
                      onClick={() => navigate(`/nfl/player/${awayTopLeader.athlete.id}`)}
                    >
                      {awayTopLeader.athlete.displayName}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-400">
                      {awayLeader?.abbreviation}
                    </div>
                  </div>
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
                </div>
              ) : (
                <div className="flex items-center justify-end text-gray-500 text-[10px] sm:text-xs">
                  No data
                </div>
              )}
              
              {/* Center Scores */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 w-[140px] sm:w-[190px]">
                <div className="text-lg sm:text-2xl font-bold text-[#faafe8] w-[50px] sm:w-[70px] text-right">
                  {awayTopLeader?.displayValue || '—'}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 w-[20px] text-center">vs</div>
                <div className="text-lg sm:text-2xl font-bold text-[#00ffe7] w-[50px] sm:w-[70px] text-left">
                  {homeTopLeader.displayValue}
                </div>
              </div>
              
              {/* Home Team Player (Right) */}
              <div className="flex items-center gap-2">
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
                <div className="flex-1 min-w-0">
                  <div 
                    className="text-xs sm:text-sm font-bold text-white truncate cursor-pointer hover:text-[#00ffe7] transition-colors"
                    onClick={() => navigate(`/nfl/player/${homeTopLeader.athlete.id}`)}
                  >
                    {homeTopLeader.athlete.displayName}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-400">
                    {homeLeader.abbreviation}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
};

export default HeadToHead;
