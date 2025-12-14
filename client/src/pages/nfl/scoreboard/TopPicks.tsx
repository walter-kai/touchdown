import React, { useMemo, useState } from 'react';
import { FaTrophy, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { usePicks } from '@/providers/PicksContext';

interface TopPicksProps {
  homeTeamId: string;
  awayTeamId: string;
  playLog: Array<{
    text: string;
    quarter: number;
    clock: string;
    yardage?: number;
    timestamp: Date;
    possession?: string;
    athletesInvolved?: Array<{
      id: string;
      fullName: string;
      displayName: string;
      shortName: string;
      headshot: string;
      jersey: string;
      position: string;
      team: { id: string };
    }>;
  }>;
  getTeamLogo: (team: any) => string;
  homeTeam: any;
  awayTeam: any;
}

interface PlayerScore {
  id: string;
  fullName: string;
  displayName: string;
  shortName: string;
  headshot: string;
  jersey: string;
  position: string;
  teamId: string;
  score: number;
  isUserPick: boolean;
}

const TopPicks: React.FC<TopPicksProps> = ({
  homeTeamId,
  awayTeamId,
  playLog,
  getTeamLogo,
  homeTeam,
  awayTeam,
}) => {
  const { getPicksWithHeadshots } = usePicks();
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate top picks from play log
  const topPicks = useMemo(() => {
    const userPicks = getPicksWithHeadshots(homeTeamId, awayTeamId);
    const userPickIds = new Set(userPicks?.players.map(p => p.id) || []);

    // Build a map of all athletes who have scored
    const athleteScores = new Map<string, PlayerScore>();

    playLog.forEach((play) => {
      if (play.athletesInvolved) {
        play.athletesInvolved.forEach((athlete) => {
          if (!athleteScores.has(athlete.id)) {
            athleteScores.set(athlete.id, {
              id: athlete.id,
              fullName: athlete.fullName,
              displayName: athlete.displayName,
              shortName: athlete.shortName,
              headshot: athlete.headshot,
              jersey: athlete.jersey,
              position: athlete.position,
              teamId: athlete.team.id,
              score: 0,
              isUserPick: userPickIds.has(athlete.id),
            });
          }
          // Increment score
          const current = athleteScores.get(athlete.id)!;
          current.score += 1;
        });
      }
    });

    // Convert to array and sort by score descending
    return Array.from(athleteScores.values())
      .filter(player => player.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [playLog, homeTeamId, awayTeamId, getPicksWithHeadshots]);

  if (topPicks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#b0b7bf] text-lg">No players have scored yet.</p>
        <p className="text-[#b0b7bf] text-sm mt-2">Check back when the game starts!</p>
      </div>
    );
  }

  // Calculate total user score
  const userTotalScore = topPicks
    .filter(p => p.isUserPick)
    .reduce((sum, p) => sum + p.score, 0);

  const displayedPicks = isExpanded ? topPicks : topPicks.slice(0, 5);
  const hasMore = topPicks.length > 5;

  return (
    <div className="space-y-4">
      {/* Divider */}
      <div className="border-t-2 border-[#00ffe7]/20 pt-2 mb-4"></div>  
      <div className='mx-2'>
        <div className="flex items-center justify-between">
          <h1>Top Picks</h1>
          {userTotalScore > 0 && (
            <div className="bg-gradient-to-r from-[#00ffe7]/20 to-[#faafe8]/20 border border-[#00ffe7]/50 rounded-lg px-4 py-2">
              <span className="text-[#b0b7bf] text-xs">YOUR TOTAL</span>
              <span className="text-[#00ffe7] font-bold text-2xl ml-3">{userTotalScore}</span>
              <span className="text-[#b0b7bf] text-xs ml-1">pts</span>
            </div>
          )}
        </div>
        <div className="border border-[#00ffe7]/20 bg-[#181a23]/50">
          {displayedPicks.map((player, index) => {
              const team = player.teamId === homeTeam?.id ? homeTeam : awayTeam;
              const teamColor = team?.team?.color || '00ffe7';
              const isHome = player.teamId === homeTeam?.id;
          
              return (
                <div
                  key={player.id}
                  className={`
                    relative border-b border-[#00ffe7]/10 last:border-b-0 transition-all
                    ${player.isUserPick
                      ? 'bg-[#00ffe7]/5'
                      : 'hover:bg-[#00ffe7]/5'
                    }
                  `}
                >
                  <div className="py-[2px] pr-3 flex items-center gap-3 relative">
                    {/* Rank Badge - Small, absolute top-left */}
                    <div className={`
                      absolute top-2 left-2 z-20 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs
                      ${index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-[#00ffe7]/80 text-black'}
                    `}>
                      {index + 1}
                    </div>
                    
                    {/* Player Image */}
                    <div className="flex-shrink-0 ml-3">
                      <img
                        src={player.headshot}
                        alt={player.displayName}
                        className={`
                          w-14 h-10 rounded-full border-2 object-cover
                          ${player.isUserPick ? 'border-[#00ffe7]' : 'border-[#00ffe7]/30'}
                        `}
                        onError={(e) => {
                          e.currentTarget.src = `https://via.placeholder.com/64?text=${player.shortName}`;
                        }}
                      />
                    </div>
                    
                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className={`font-bold text-base truncate ${player.isUserPick ? 'text-[#00ffe7]' : 'text-white'}`}>
                          {player.shortName || player.displayName}
                        </h4>
                        {player.isUserPick && (
                          <span className="bg-[#00ffe7] text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
                            YOURS
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#b0b7bf]">
                          {player.position} • #{player.jersey}
                        </span>
                        <div className="flex items-center gap-1">
                          <img
                            src={getTeamLogo(team)}
                            alt=""
                            className="w-3 h-3"
                          />
                          <span className="text-[#b0b7bf] text-[10px]">
                            {team?.team?.abbreviation}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Score */}
                    <div className="flex-shrink-0 text-right pr-2">
                      <div className={`
                        text-2xl font-bold
                        ${player.isUserPick ? 'text-[#00ffe7]' : 'text-white'}
                      `}>
                        {player.score}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expand Button */}
          {hasMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="btn-green w-full mt-2 flex items-center justify-center gap-2"
            >
              {isExpanded ? (
                <>
                  <FaChevronUp />
                  Show Less
                </>
              ) : (
                <>
                  <FaChevronDown />
                  Show All ({topPicks.length})
                </>
              )}
            </button>
          )}
      </div>
    </div>
  );
};

export default TopPicks;
