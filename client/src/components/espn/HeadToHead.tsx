import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaFootballBall } from "react-icons/fa";
import axios from "axios";
import type { LeaderCategory } from "@/types/espn/scoreboard";
import { useLeague } from "@/providers/LeagueContext";
import { getTeamApiUrl } from "@/utils/espnApi";

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
  const router = useRouter();
  const { league, getHeadshotUrl } = useLeague();
  const fetchedKeyRef = useRef<string | null>(null);
  const [homeTeamLeaders, setHomeTeamLeaders] = useState<LeaderCategory[]>([]);
  const [awayTeamLeaders, setAwayTeamLeaders] = useState<LeaderCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = `${homeTeamId}-${awayTeamId}`;
    if (!homeTeamId || !awayTeamId) {
      setLoading(false);
      return;
    }
    // Prevent duplicate fetches on re-render/StrictMode
    if (fetchedKeyRef.current === key) return;
    fetchedKeyRef.current = key;

    const abortController = new AbortController();

    const fetchLeaders = async () => {
      try {
        setLoading(true);
        setError(null);

        const [homeResponse, awayResponse] = await Promise.all([
          axios.get(
            getTeamApiUrl(league, homeTeamId),
            { signal: abortController.signal }
          ),
          axios.get(
            getTeamApiUrl(league, awayTeamId),
            { signal: abortController.signal }
          )
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
        if ((err as any)?.name === 'CanceledError') return;
        console.error('Failed to fetch team leaders:', err);
        setError('Failed to load team leaders data');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();

    return () => {
      abortController.abort();
    };
  }, [homeTeamId, awayTeamId]);

  if (loading) {
    return (
      <div className="text-center py-6">
        <p className="text-neon-cyan">Loading head-to-head data...</p>
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
      <h3 className="text-neon-cyan font-bold text-lg mb-4">Head-to-Head Leaders</h3>
      
      <div className="space-y-3">
        {homeTeamLeaders.map((homeLeader: LeaderCategory, idx: number) => {
          const homeTopLeader = homeLeader.leaders?.[0];
          if (!homeTopLeader) return null;
          
          // Find matching category in away team leaders
          const awayLeader = awayTeamLeaders.find((l: LeaderCategory) => l.name === homeLeader.name);
          const awayTopLeader = awayLeader?.leaders?.[0];
          
          return (
            <div 
              key={idx} 
              className="bg-bg-dark/50 rounded-lg p-3 border border-neon-cyan/20"
            >
              {/* Category Header */}
              <div className="text-neon-cyan text-xs font-bold uppercase mb-3 text-center">
                {homeLeader.displayName}
              </div>

              {/* Head to Head Comparison */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                
                {/* Away Team Player (Left) */}
                <div className="flex items-center gap-2 justify-start">
                  {awayTopLeader ? (
                    <>
                      {(() => {
                        const headshotUrl = getHeadshotUrl({ id: awayTopLeader.athlete.id, headshot: awayTopLeader.athlete.headshot });
                        return headshotUrl ? (
                          <img 
                          src={headshotUrl}
                          alt={awayTopLeader.athlete.displayName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-neon-pink/50 cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
                          onClick={() => router.push(`/nfl/player/${awayTopLeader.athlete.id}`)}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        ) : null;
                      })()}
                      <div 
                        className="w-10 h-10 rounded-full bg-bg-darker border-2 border-neon-pink/50 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
                        style={{ display: getHeadshotUrl({ id: awayTopLeader.athlete.id, headshot: awayTopLeader.athlete.headshot }) ? 'none' : 'flex' }}
                        onClick={() => router.push(`/nfl/player/${awayTopLeader.athlete.id}`)}
                      >
                        <FaFootballBall className="text-neon-pink text-xs" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div 
                          className="font-bold text-sm text-white cursor-pointer hover:text-neon-pink transition-colors truncate text-right"
                          onClick={() => router.push(`/nfl/player/${awayTopLeader.athlete.id}`)}
                        >
                          {awayTopLeader.athlete.displayName}
                        </div>
                        <div className="text-neon-pink font-bold text-lg text-right">
                          {awayTopLeader.displayValue}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-bg-darker/50 border-2 border-neon-pink/20 flex items-center justify-center flex-shrink-0">
                        <FaFootballBall className="text-neon-pink/30 text-xs" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-gray-500 text-sm">No data</div>
                      </div>
                    </>
                  )}
                </div>
                
                {/* VS Divider (Center) */}
                <div className="text-gray-400 text-xs font-bold flex-shrink-0">VS</div>
                
                {/* Home Team Player (Right) */}
                <div className="flex items-center gap-2 justify-end">
                  <div className="min-w-0 flex-1">
                    <div 
                      className="font-bold text-sm text-white cursor-pointer hover:text-neon-cyan transition-colors truncate text-left"
                      onClick={() => router.push(`/nfl/player/${homeTopLeader.athlete.id}`)}
                    >
                      {homeTopLeader.athlete.displayName}
                    </div>
                    <div className="text-neon-cyan font-bold text-lg text-left">
                      {homeTopLeader.displayValue}
                    </div>
                  </div>
                  {(() => {
                    const headshotUrl = getHeadshotUrl({ id: homeTopLeader.athlete.id, headshot: homeTopLeader.athlete.headshot });
                    return headshotUrl ? (
                      <img 
                        src={headshotUrl}
                        alt={homeTopLeader.athlete.displayName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-neon-cyan/50 cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
                        onClick={() => router.push(`/nfl/player/${homeTopLeader.athlete.id}`)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null;
                  })()}
                  <div 
                    className="w-10 h-10 rounded-full bg-bg-darker border-2 border-neon-cyan/50 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
                    style={{ display: getHeadshotUrl({ id: homeTopLeader.athlete.id, headshot: homeTopLeader.athlete.headshot }) ? 'none' : 'flex' }}
                    onClick={() => router.push(`/nfl/player/${homeTopLeader.athlete.id}`)}
                  >
                    <FaFootballBall className="text-neon-cyan text-xs" />
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

export default React.memo(HeadToHead);
