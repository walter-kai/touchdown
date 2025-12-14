import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFootballBall } from 'react-icons/fa';
import { GiPodium } from "react-icons/gi";
import type { Summary } from '@/types/espn/summary';

interface HeadToHeadProps {
  summary: Summary | null;
  homeTeamId?: string;
  awayTeamId?: string;
}

const GameLeaders: React.FC<HeadToHeadProps> = ({ summary, homeTeamId, awayTeamId }) => {
  const navigate = useNavigate();

  if (!summary?.leaders || summary.leaders.length === 0) {
    return null;
  }

  const homeTeamGroup = summary.leaders.find(g => g.team.id === homeTeamId);
  const awayTeamGroup = summary.leaders.find(g => g.team.id === awayTeamId);

  if (!homeTeamGroup || !awayTeamGroup) {
    return null;
  }

  return (
    <div>
      {/* Divider */}
      <div className="border-t-2 border-[#00ffe7]/20 pt-2 mb-4"></div>
      <div className="mx-2">
        <div className="flex items-center mb-6 pb-3 border-b border-[#00ffe7]/10">
          <h1>Game Leaders</h1>
        </div>
      </div>

      <div className="mx-2">
        <div className="space-y-3">
        {homeTeamGroup.leaders.map((category, catIdx) => {
          const otherCategory = awayTeamGroup.leaders.find(c => c.name === category.name);
          
          if (!otherCategory || !category.leaders || !otherCategory.leaders || !category.leaders[0] || !otherCategory.leaders[0]) {
            return null;
          }

          const homeLeader = category.leaders[0];
          const awayLeader = otherCategory.leaders[0];

          return (
            <div key={`category-${catIdx}`} className="bg-[#23263a]/50 rounded-lg p-3 border border-[#00ffe7]/10">
              <div className="grid grid-cols-3 gap-2 items-center">
                {/* Away Leader */}
                <div
                  className="flex flex-col items-center cursor-pointer hover:bg-[#00ffe7]/5 p-1 rounded transition-colors"
                  onClick={() => navigate(`/nfl/player/${awayLeader.athlete.id}`)}
                >
                  {(() => {
                    const headshot = awayLeader.athlete.headshot;
                    const headshotUrl = typeof headshot === 'string' ? headshot : headshot?.href;
                    return headshotUrl ? (
                      <img
                        src={headshotUrl}
                        alt={awayLeader.athlete.displayName}
                        className="w-12 h-12 rounded-full mb-1 border-2 border-[#00ffe7]/30 object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full mb-1 border-2 border-[#00ffe7]/30 bg-[#23263a] flex items-center justify-center">
                        <FaFootballBall className="text-[#00ffe7] text-sm" />
                      </div>
                    );
                  })()}
                  <p className="text-[#e0e7ef] font-semibold text-xs text-center truncate w-full">
                    {awayLeader.athlete.displayName}
                  </p>
                  {awayLeader.displayValue && (
                    <p className="text-[#00ffe7] font-bold text-xs">{awayLeader.displayValue.split(',')[0].trim()}</p>
                  )}
                </div>

                {/* VS */}
                <div className="flex items-center justify-center">
                  <span className="text-[#b0b7bf] text-xs font-bold">VS</span>
                </div>

                {/* Home Leader */}
                <div
                  className="flex flex-col items-center cursor-pointer hover:bg-[#faafe8]/5 p-1 rounded transition-colors"
                  onClick={() => navigate(`/nfl/player/${homeLeader.athlete.id}`)}
                >
                  {(() => {
                    const headshot = homeLeader.athlete.headshot;
                    const headshotUrl = typeof headshot === 'string' ? headshot : headshot?.href;
                    return headshotUrl ? (
                      <img
                        src={headshotUrl}
                        alt={homeLeader.athlete.displayName}
                        className="w-12 h-12 rounded-full mb-1 border-2 border-[#faafe8]/30 object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full mb-1 border-2 border-[#faafe8]/30 bg-[#23263a] flex items-center justify-center">
                        <FaFootballBall className="text-[#faafe8] text-sm" />
                      </div>
                    );
                  })()}
                  <p className="text-[#e0e7ef] font-semibold text-xs text-center truncate w-full">
                    {homeLeader.athlete.shortName || homeLeader.athlete.displayName}
                  </p>
                  {homeLeader.displayValue && (
                    <p className="text-[#faafe8] font-bold text-xs">{homeLeader.displayValue.split(',')[0].trim()}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default GameLeaders;
