import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrophy, FaChartBar, FaFootballBall, FaPauseCircle } from 'react-icons/fa';
import Prediction from '@/components/nfl/Prediction';
import ProbChart from '@/components/nfl/ProbabilityChart';
import type { Summary } from '@/types/espn/summary';
import type { Event } from '@/types/espn/scoreboard';

interface SummaryViewProps {
  summary: Summary;
  event: Event;
  gameId: string;
  playerRef: React.RefObject<HTMLDivElement>;
  teamRef: React.RefObject<HTMLDivElement>;
  playsRef: React.RefObject<HTMLDivElement>;
  predictionRef: React.RefObject<HTMLDivElement>;
  oddsRef: React.RefObject<HTMLDivElement>;
  getTeamLogo: (team: any) => string;
}

const SummaryView: React.FC<SummaryViewProps> = ({ 
  summary, 
  event,
  gameId,
  playerRef, 
  teamRef,
  playsRef,
  predictionRef,
  oddsRef,
  getTeamLogo 
}) => {
  const navigate = useNavigate();
  const competition = event.competitions[0];
  const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
  const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

  return (
    <>
      {/* Player Statistics Section */}
      {summary?.boxscore?.players && (
        <div id="player" ref={playerRef} className="scroll-mt-20 py-4">
          <h3 className="text-[#00ffe7] font-bold text-2xl mb-6 flex items-center gap-2">
            <FaTrophy />
            Player Statistics
          </h3>
          
          {summary.boxscore.players.length > 0 ? (
            <div className="space-y-8">
              {summary.boxscore.players.map((teamData, teamIdx) => (
                <div key={`team-${teamIdx}`} className="space-y-4">
                  {/* Team Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <img 
                      src={getTeamLogo(teamData.team)} 
                      alt={teamData.team.displayName}
                      className="w-10 h-10"
                    />
                    <h4 className="text-[#00ffe7] font-bold text-xl">{teamData.team.displayName}</h4>
                  </div>

                  {/* Statistics Categories */}
                  {teamData.statistics.map((category, catIdx) => (
                    <div key={`${teamData.team.id}-${category.name}-${catIdx}`} className="bg-[#23263a]/50 rounded-lg p-2 sm:p-4 border border-[#00ffe7]/10">
                      <h5 className="text-[#b0b7bf] font-semibold text-xs sm:text-sm mb-2">{category.text}</h5>
                      
                      {/* Table for player stats */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b border-[#00ffe7]/10">
                              <th className="text-left py-2 px-1 sm:px-2 text-[#b0b7bf] font-semibold">Player</th>
                              {category.labels.map((label, labelIdx) => (
                                <th key={`label-${labelIdx}`} className="text-center py-2 px-1 sm:px-2 text-[#b0b7bf] font-semibold whitespace-nowrap">
                                  {label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {category.athletes.map((athleteData, athleteIdx) => (
                              <tr 
                                key={`${athleteData.athlete.id}-${athleteIdx}`}
                                className="border-b border-[#00ffe7]/5 hover:bg-[#00ffe7]/5 transition-colors cursor-pointer"
                                onClick={() => navigate(`/nfl/player/${athleteData.athlete.id}`)}
                              >
                                <td className="py-2 px-1 sm:px-2">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <img 
                                      src={athleteData.athlete.headshot?.href} 
                                      alt={athleteData.athlete.displayName}
                                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                                    />
                                    <div className="min-w-0">
                                      <p className="text-[#e0e7ef] font-semibold text-xs sm:text-sm truncate">
                                        {athleteData.athlete.displayName}
                                      </p>
                                      <p className="text-[#b0b7bf] text-[10px] sm:text-xs">
                                        #{athleteData.athlete.jersey}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                {athleteData.stats.map((stat, statIdx) => (
                                  <td key={`stat-${statIdx}`} className="text-center py-2 px-1 sm:px-2 text-[#e0e7ef] text-xs sm:text-sm">
                                    {stat}
                                  </td>
                                ))}
                              </tr>
                            ))}
                            {/* Totals row */}
                            {category.totals && category.totals.length > 0 && (
                              <tr className="border-t-2 border-[#00ffe7]/20 font-bold bg-[#00ffe7]/5">
                                <td className="py-2 px-1 sm:px-2 text-[#00ffe7] text-xs sm:text-sm">Total</td>
                                {category.totals.map((total, totalIdx) => (
                                  <td key={`total-${totalIdx}`} className="text-center py-2 px-1 sm:px-2 text-[#00ffe7] text-xs sm:text-sm">
                                    {total}
                                  </td>
                                ))}
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#b0b7bf] text-center py-8">Player statistics will be available after the game.</p>
          )}
        </div>
      )}

      {/* Team Stats Section */}
      <div id="team" ref={teamRef} className="scroll-mt-20 py-4">
        <h3 className="text-[#00ffe7] font-bold text-2xl mb-6 flex items-center gap-2">
          <FaChartBar />
          Team Statistics
        </h3>
        {summary?.boxscore?.teams && summary.boxscore.teams.length === 2 ? (
          <div className="space-y-4">
            {/* Team Headers */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="flex items-center justify-center">
                <img 
                  src={getTeamLogo(summary.boxscore.teams.find(t => t.homeAway === 'away')?.team)} 
                  alt={summary.boxscore.teams.find(t => t.homeAway === 'away')?.team.displayName}
                  className="w-12 h-12"
                />
              </div>
              <div className="flex items-center justify-center">
                <p className="text-[#b0b7bf] text-sm font-semibold">Stat</p>
              </div>
              <div className="flex items-center justify-center">
                <img 
                  src={getTeamLogo(summary.boxscore.teams.find(t => t.homeAway === 'home')?.team)} 
                  alt={summary.boxscore.teams.find(t => t.homeAway === 'home')?.team.displayName}
                  className="w-12 h-12"
                />
              </div>
            </div>

            {/* Stats Comparison */}
            {summary.boxscore.teams[0].statistics.map((_, statIdx) => {
              const awayTeamData = summary.boxscore.teams.find(t => t.homeAway === 'away');
              const homeTeamData = summary.boxscore.teams.find(t => t.homeAway === 'home');
              const awayStat = awayTeamData?.statistics[statIdx];
              const homeStat = homeTeamData?.statistics[statIdx];
              
              if (!awayStat || !homeStat) return null;
              
              return (
                <div key={`stat-${statIdx}`} className="grid grid-cols-3 gap-4 items-center bg-[#23263a]/50 rounded-lg p-3 border border-[#00ffe7]/10">
                  <div className="text-center">
                    <p className="text-[#00ffe7] font-bold text-lg">
                      {awayStat.displayValue}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#b0b7bf] text-sm font-semibold">
                      {awayStat.label}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#00ffe7] font-bold text-lg">
                      {homeStat.displayValue}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[#b0b7bf] text-center py-8">Team statistics will be available after the game.</p>
        )}
      </div>

      {/* Plays Section - Drive by Drive */}
      {summary?.drives && (
        <div id="plays" ref={playsRef} className="scroll-mt-20 py-4">
          <h3 className="text-[#00ffe7] font-bold text-2xl mb-6 flex items-center gap-2">
            <FaFootballBall />
            Play by Play - All Drives
          </h3>

            {summary.drives.previous && summary.drives.previous.length > 0 ? (
              <div className="">
                <div className="space-y-6">
                  {summary.drives.previous.map((drive, driveIdx) => {
                    const driveTeam = drive.team;
                    const isHomeTeam = driveTeam.id === homeTeam?.id;
                    const bgClass = isHomeTeam ? 'from-[#faafe8]/10 border-l-4 border-[#faafe8]' : 'from-[#00ffe7]/10 border-l-4 border-[#00ffe7]';
                    
                    return (
                      <div key={`drive-${drive.id}-${driveIdx}`} className={`bg-gradient-to-r ${bgClass} rounded-lg p-4 mb-4`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <img src={getTeamLogo(driveTeam)} alt="" className="w-8 h-8" />
                            <span className={`font-bold text-sm ${isHomeTeam ? 'text-[#faafe8]' : 'text-[#00ffe7]'}`}>
                              {driveTeam.displayName} - {drive.description}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-sm ${isHomeTeam ? 'text-[#faafe8]' : 'text-[#00ffe7]'}`}>
                              {drive.displayResult}
                            </p>
                            <p className="text-[#b0b7bf] text-xs">
                              {drive.offensivePlays} plays, {drive.yards} yards, {drive.timeElapsed.displayValue}
                            </p>
                          </div>
                        </div>

                        {drive.plays && drive.plays.length > 0 && (
                          <div className="space-y-4">
                            {drive.plays.map((play, playIdx) => {
                              const playText = play.text;
                              const parts = playText.split(/\.\n+\s+(?=\w)|(?=PENALTY)/g).filter(part => part.trim());

                              return (
                                <div key={`play-${play.id}-${playIdx}`} className="relative flex items-start gap-4">
                                  <div className="relative flex flex-col items-center flex-shrink-0" style={{ width: '48px' }}>
                                    <div className={`w-4 h-4 rounded-full border-2 ${
                                      play.scoringPlay 
                                        ? 'bg-green-400 border-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' 
                                        : 'bg-[#23263a] border-[#00ffe7]/40'
                                    } z-10`}></div>
                                    <div className="text-center mt-1">
                                      <p className="text-[10px] font-bold text-[#00ffe7]">Q{play.period.number}</p>
                                      <p className="text-[9px] font-mono text-[#00ffe7]">{play.clock.displayValue}</p>
                                    </div>
                                  </div>

                                  <div className={`flex-1 pb-4 ${play.scoringPlay ? 'bg-green-500/5 -ml-2 pl-2 pr-2 rounded-lg' : ''}`}>
                                    <div className="space-y-1">
                                      {parts.map((part, partIdx) => {
                                        const trimmedPart = part.trim();
                                        const isTimeout = trimmedPart.toLowerCase().includes('timeout');
                                        return (
                                          <p key={partIdx} className={`text-sm ${
                                            play.scoringPlay ? 'text-green-400 font-medium' : 'text-[#b0b7bf]'
                                          } flex items-center gap-2`}>
                                            {isTimeout && <FaPauseCircle className="text-yellow-400 flex-shrink-0" />}
                                            <span>{trimmedPart}{trimmedPart.endsWith('.') ? '' : '.'}</span>
                                          </p>
                                        );
                                      })}
                                    </div>

                                    {play.scoringPlay && play.scoringType && (
                                      <div className="flex items-center gap-2 mt-2">
                                        <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded">
                                          {play.scoringType.displayName}
                                        </span>
                                      </div>
                                    )}

                                    {play.statYardage !== undefined && (
                                      <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[#b0b7bf] text-xs">Yards:</span>
                                        <span className={`font-bold text-sm ${
                                          play.statYardage > 0 ? 'text-green-400' : play.statYardage < 0 ? 'text-red-400' : 'text-gray-400'
                                        }`}>{play.statYardage > 0 ? '+' : ''}{play.statYardage}</span>
                                      </div>
                                    )}

                                    {play.athletesInvolved && play.athletesInvolved.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                        {play.athletesInvolved.slice(0, 3).map((athlete) => (
                                          <div key={athlete.id} className="flex items-center gap-1 bg-[#1a1d2e]/30 rounded-full px-1.5 py-0.5">
                                            {athlete.headshot && (
                                              <img src={athlete.headshot} alt="" className="w-4 h-4 rounded-full" 
                                                onError={(e) => e.currentTarget.style.display = 'none'} />
                                            )}
                                            <span className="text-gray-300 text-xs">{athlete.shortName}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* End of Game Marker */}
                  <div className="relative flex items-start gap-4">
                    <div className="relative flex flex-col items-center flex-shrink-0" style={{ width: '48px' }}>
                      <div className="w-4 h-4 rounded-full bg-[#faafe8] border-2 border-[#faafe8] shadow-[0_0_8px_rgba(250,175,232,0.6)] z-10"></div>
                      <p className="text-[10px] font-bold text-[#faafe8] mt-1">END</p>
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-sm text-[#b0b7bf] italic">Game Complete</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[#b0b7bf] text-center py-8">No drive data available.</p>
            )}
        </div>
      )}

      {/* Predictions Section */}
      <div id="prediction" ref={predictionRef} className="scroll-mt-20">
        <Prediction
          gameId={gameId}
          competitionId={competition.id}
          homeTeamInfo={{
            name: homeTeam?.team.displayName || '',
            logo: getTeamLogo(homeTeam),
            color: homeTeam?.team.color || '00ffe7'
          }}
          awayTeamInfo={{
            name: awayTeam?.team.displayName || '',
            logo: getTeamLogo(awayTeam),
            color: awayTeam?.team.color || 'faafe8'
          }}
        />
      </div>
      
      {/* Odds Section */}
      <div id="odds" ref={oddsRef} className="scroll-mt-20">
        <ProbChart
          gameId={gameId}
          competitionId={competition.id}
          gameStatus={competition.status.type.state}
          homeTeamInfo={{
            name: homeTeam?.team.displayName || '',
            logo: getTeamLogo(homeTeam),
            color: homeTeam?.team.color || '00ffe7'
          }}
          awayTeamInfo={{
            name: awayTeam?.team.displayName || '',
            logo: getTeamLogo(awayTeam),
            color: awayTeam?.team.color || 'faafe8'
          }}
        />
      </div>
    </>
  );
};

export default SummaryView;
