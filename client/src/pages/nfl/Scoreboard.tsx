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
      <div id="player" ref={playerRef} className="scroll-mt-20 py-4">
        {/* Box Score */}
        <div className="p-6 mb-6">
          <div className="text-center mb-4">
            <p className="text-[#e0e7ef] text-base md:text-lg font-bold">
              {new Date(competition.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
            <p className="text-[#b0b7bf] text-sm">
              {new Date(competition.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <button 
              onClick={() => awayTeam?.id && navigate(`/nfl/team/${awayTeam.id}`)}
              className="flex flex-col items-center hover:bg-[#00ffe7]/10 rounded-lg p-3 transition-all group cursor-pointer"
            >
              <img 
                src={getTeamLogo(awayTeam?.team)} 
                alt={awayTeam?.team?.displayName}
                className="w-16 h-16 md:w-20 md:h-20 mb-2 group-hover:scale-110 transition-transform"
              />
              <h2 className="text-[#e0e7ef] font-bold text-sm md:text-base text-center px-2 group-hover:text-[#00ffe7] transition-colors">
                {awayTeam?.team?.displayName}
              </h2>
              <p className="text-[#b0b7bf] text-xs">{awayTeam?.records?.[0]?.summary}</p>
              <p className="text-[#00ffe7] text-3xl md:text-4xl font-bold mt-1">{awayTeam?.score || '0'}</p>
            </button>

            <button 
              onClick={() => homeTeam?.id && navigate(`/nfl/team/${homeTeam.id}`)}
              className="flex flex-col items-center hover:bg-[#00ffe7]/10 rounded-lg p-3 transition-all group cursor-pointer"
            >
              <img 
                src={getTeamLogo(homeTeam?.team)} 
                alt={homeTeam?.team?.displayName}
                className="w-16 h-16 md:w-20 md:h-20 mb-2 group-hover:scale-110 transition-transform"
              />
              <h2 className="text-[#e0e7ef] font-bold text-sm md:text-base text-center px-2 group-hover:text-[#00ffe7] transition-colors">
                {homeTeam?.team?.displayName}
              </h2>
              <p className="text-[#b0b7bf] text-xs">{homeTeam?.records?.[0]?.summary}</p>
              <p className="text-[#00ffe7] text-3xl md:text-4xl font-bold mt-1">{homeTeam?.score || '0'}</p>
            </button>
          </div>
        </div>

        <h3 className="text-[#00ffe7] font-bold text-2xl mb-6 flex items-center gap-2">
          <FaTrophy />
          Leaders
        </h3>
        
        {competition.leaders && competition.leaders.length > 0 ? (
          <div className="space-y-6">
            {competition.leaders.map((category, categoryIdx) => (
              <div key={`${category.name}-${categoryIdx}`} className="border-b border-[#00ffe7]/10 pb-6 last:border-b-0">
                <h4 className="text-[#b0b7bf] text-sm font-semibold mb-4">
                  {category.displayName}
                </h4>
                <div className="space-y-3">
                  {category.leaders.map((leader, leaderIdx) => (
                    <button 
                      key={`${leader.athlete.id}-${leaderIdx}`}
                      onClick={() => navigate(`/nfl/player/${leader.athlete.id}`)}
                      className="w-full text-left hover:bg-[#00ffe7]/5 rounded-lg p-2 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={leader.athlete.headshot} 
                          alt={leader.athlete.displayName}
                          className="w-10 h-10 rounded-full group-hover:scale-110 transition-transform"
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

      {/* Head to Head Section */}
      {homeTeam && awayTeam && (
        <div id="headtohead" ref={headtoheadRef} className="scroll-mt-20 py-4">
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
