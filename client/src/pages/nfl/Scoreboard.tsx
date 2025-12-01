import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrophy } from 'react-icons/fa';
import HeadToHead from '@/components/nfl/HeadToHead';
import type { Event } from '@/types/espn/scoreboard';

interface ScoreboardViewProps {
  event: Event;
  playerRef: React.RefObject<HTMLDivElement>;
  headtoheadRef: React.RefObject<HTMLDivElement>;
  getTeamLogo: (team: any) => string;
}

const ScoreboardView: React.FC<ScoreboardViewProps> = ({ 
  event, 
  playerRef, 
  headtoheadRef,
  getTeamLogo 
}) => {
  const navigate = useNavigate();
  const competition = event.competitions[0];
  const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
  const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

  return (
    <>
      {/* Player Leaders Section */}
      <div id="player" ref={playerRef} className="scroll-mt-20">
        <div className="bg-[#181a23]/90 border border-[#00ffe7]/30 rounded-xl shadow-[0_0_20px_rgba(0,255,231,0.1)] p-6">
          <h3 className="text-[#00ffe7] font-bold text-2xl mb-6 flex items-center gap-2">
            <FaTrophy />
            Leaders
          </h3>
          
          {competition.leaders && competition.leaders.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {competition.leaders.map((category, categoryIdx) => (
                <div key={`${category.name}-${categoryIdx}`} className="bg-[#23263a]/50 rounded-lg p-6 border border-[#00ffe7]/10 hover:border-[#00ffe7]/30 transition-all">
                  <h4 className="text-[#b0b7bf] text-sm font-semibold mb-4 text-center">
                    {category.displayName}
                  </h4>
                  <div className="space-y-4">
                    {category.leaders.map((leader, leaderIdx) => (
                      <button 
                        key={`${leader.athlete.id}-${leaderIdx}`}
                        onClick={() => navigate(`/nfl/player/${leader.athlete.id}`)}
                        className="w-full text-left hover:bg-[#00ffe7]/10 rounded-lg p-2 transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={leader.athlete.headshot} 
                            alt={leader.athlete.displayName}
                            className="w-12 h-12 rounded-full group-hover:scale-110 transition-transform"
                          />
                          <div className="flex-1">
                            <p className="text-[#e0e7ef] font-bold text-sm group-hover:text-[#00ffe7] transition-colors">
                              {leader.athlete.displayName}
                            </p>
                            <p className="text-[#b0b7bf] text-xs">
                              {leader.athlete.position?.abbreviation || ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[#00ffe7] font-bold text-lg">
                              {leader.displayValue}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#b0b7bf] text-center py-8">No player leaders available at this time.</p>
          )}
        </div>
      </div>

      {/* Head to Head Section */}
      {homeTeam && awayTeam && (
        <div id="headtohead" ref={headtoheadRef} className="scroll-mt-20">
          <HeadToHead
            homeTeamId={homeTeam.id}
            awayTeamId={awayTeam.id}
            homeTeamName={homeTeam.team.displayName}
            awayTeamName={awayTeam.team.displayName}
          />
        </div>
      )}
    </>
  );
};

export default ScoreboardView;
