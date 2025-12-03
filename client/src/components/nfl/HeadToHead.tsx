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
            <div className="flex items-start justify-between gap-6">
              
              {/* Away Team Player + Stats (Left) */}
              <div className="flex flex-col items-center gap-3 flex-1">
                <div className="flex items-center gap-2 w-full justify-center">
                  {awayTopLeader ? (
                    <>
                      {awayTopLeader.athlete.headshot ? (
                        <img 
                          src={awayTopLeader.athlete.headshot}
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
                        style={{ display: awayTopLeader.athlete.headshot ? 'none' : 'flex' }}
                        onClick={() => navigate(`/nfl/player/${awayTopLeader.athlete.id}`)}
                      >
                        <FaFootballBall className="text-[#faafe8]" />
                      </div>
                      <div className="text-left">
                        <div 
                          className="text-sm font-bold text-white cursor-pointer hover:text-[#faafe8] transition-colors"
                          onClick={() => navigate(`/nfl/player/${awayTopLeader.athlete.id}`)}
                        >
                          {awayTopLeader.athlete.displayName}
                        </div>
                        <div className="text-xs text-gray-400">
                          {awayLeader?.abbreviation}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500 text-xs">No data</div>
                  )}
                </div>
                <div className="flex flex-col items-center gap-1">
                  {awayTopLeader?.displayValue ? (
                    awayTopLeader.displayValue.split(',').map((stat, idx) => (
                      <div key={idx} className="text-sm font-bold text-[#faafe8]">
                        {stat.trim()}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm font-bold text-[#faafe8]">—</div>
                  )}
                </div>
              </div>
              
              {/* VS Divider */}
              <div className="flex items-center justify-center pt-8">
                <div className="text-sm text-gray-400">vs</div>
              </div>
              
              {/* Home Team Player + Stats (Right) */}
              <div className="flex flex-col items-center gap-3 flex-1">
                <div className="flex items-center gap-2 w-full justify-center">
                  <div className="text-right">
                    <div 
                      className="text-sm font-bold text-white cursor-pointer hover:text-[#00ffe7] transition-colors"
                      onClick={() => navigate(`/nfl/player/${homeTopLeader.athlete.id}`)}
                    >
                      {homeTopLeader.athlete.displayName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {homeLeader.abbreviation}
                    </div>
                  </div>
                  {homeTopLeader.athlete.headshot ? (
                    <img 
                      src={homeTopLeader.athlete.headshot}
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
                    style={{ display: homeTopLeader.athlete.headshot ? 'none' : 'flex' }}
                    onClick={() => navigate(`/nfl/player/${homeTopLeader.athlete.id}`)}
                  >
                    <FaFootballBall className="text-[#00ffe7]" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  {homeTopLeader.displayValue.split(',').map((stat, idx) => (
                    <div key={idx} className="text-sm font-bold text-[#00ffe7]">
                      {stat.trim()}
                    </div>
                  ))}
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
