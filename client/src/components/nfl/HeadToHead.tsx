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
      <div className="text-center py-6">
        <p className="text-[#00ffe7]">Loading head-to-head data...</p>
      </div>
    );
  }

  if (error || !homeTeamLeaders.length || !awayTeamLeaders.length) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-400">{error || 'No head-to-head data available'}</p>
      </div>
    );
  }
  
  return (
    <div>
      <h3 className="text-[#00ffe7] font-bold text-lg mb-4 flex items-center gap-2">
        <FaFootballBall className="text-[#00ffe7]" />
        Head-to-Head Leaders
      </h3>
      
      <div className="space-y-3">
        {homeTeamLeaders.map((homeLeader: Leader, idx: number) => {
          const homeTopLeader = homeLeader.leaders?.[0];
          if (!homeTopLeader) return null;
          
          // Find matching category in away team leaders
          const awayLeader = awayTeamLeaders.find((l: Leader) => l.name === homeLeader.name);
          const awayTopLeader = awayLeader?.leaders?.[0];
          
          return (
            <div 
              key={idx} 
              className="bg-[#181a23]/50 rounded-lg p-3 border border-[#00ffe7]/20"
            >
              {/* Category Header */}
              <div className="text-[#00ffe7] text-xs font-bold uppercase mb-3 text-center">
                {homeLeader.displayName}
              </div>

              {/* Head to Head Comparison */}
              <div className="flex items-center justify-between gap-3">
                
                {/* Away Team Player (Left) */}
                <div className="flex items-center gap-2 flex-1">
                  {awayTopLeader ? (
                    <>
                      {awayTopLeader.athlete.headshot?.href ? (
                        <img 
                          src={awayTopLeader.athlete.headshot.href}
                          alt={awayTopLeader.athlete.displayName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#faafe8]/50 cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
                          onClick={() => navigate(`/nfl/player/${awayTopLeader.athlete.id}`)}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-10 h-10 rounded-full bg-[#23263a] border-2 border-[#faafe8]/50 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
                        style={{ display: awayTopLeader.athlete.headshot?.href ? 'none' : 'flex' }}
                        onClick={() => navigate(`/nfl/player/${awayTopLeader.athlete.id}`)}
                      >
                        <FaFootballBall className="text-[#faafe8] text-xs" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div 
                          className="font-bold text-white cursor-pointer hover:text-[#faafe8] transition-colors truncate"
                          onClick={() => navigate(`/nfl/player/${awayTopLeader.athlete.id}`)}
                        >
                          {awayTopLeader.athlete.displayName}
                        </div>
                        <div className="text-[#faafe8] font-bold text-sm">
                          {awayTopLeader.displayValue}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500 text-xs">No data</div>
                  )}
                </div>
                
                {/* VS Divider (Center) */}
                <div className="text-gray-400 text-xs font-bold px-2 flex-shrink-0">VS</div>
                
                {/* Home Team Player (Right) */}
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <div className="flex-1 min-w-0 text-right">
                    <div 
                      className="font-bold text-white cursor-pointer hover:text-[#00ffe7] transition-colors truncate"
                      onClick={() => navigate(`/nfl/player/${homeTopLeader.athlete.id}`)}
                    >
                      {homeTopLeader.athlete.displayName}
                    </div>
                    <div className="text-[#00ffe7] font-bold text-sm">
                      {homeTopLeader.displayValue}
                    </div>
                  </div>
                  {homeTopLeader.athlete.headshot?.href ? (
                    <img 
                      src={homeTopLeader.athlete.headshot.href}
                      alt={homeTopLeader.athlete.displayName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#00ffe7]/50 cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
                      onClick={() => navigate(`/nfl/player/${homeTopLeader.athlete.id}`)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-10 h-10 rounded-full bg-[#23263a] border-2 border-[#00ffe7]/50 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
                    style={{ display: homeTopLeader.athlete.headshot?.href ? 'none' : 'flex' }}
                    onClick={() => navigate(`/nfl/player/${homeTopLeader.athlete.id}`)}
                  >
                    <FaFootballBall className="text-[#00ffe7] text-xs" />
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
