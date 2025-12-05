import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrophy, FaChartBar, FaFootballBall, FaPauseCircle } from 'react-icons/fa';
import Prediction from '@/components/nfl/Prediction';
import type { Summary } from '@/types/espn/summary';
import type { Event } from '@/types/espn/scoreboard';

interface SummaryViewProps {
  summary: Summary;
  event: Event;
  gameId: string;
  playerRef: React.RefObject<HTMLDivElement>;
  headtoheadRef: React.RefObject<HTMLDivElement>;
  teamRef: React.RefObject<HTMLDivElement>;
  playsRef: React.RefObject<HTMLDivElement>;
  predictionRef: React.RefObject<HTMLDivElement>;
  getTeamLogo: (team: any) => string;
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
}

const SummaryView: React.FC<SummaryViewProps> = ({ 
  summary, 
  event,
  gameId,
  playerRef, 
  headtoheadRef,
  teamRef,
  playsRef,
  predictionRef,
  getTeamLogo,
  playLog
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

      {/* Head-to-Head Section */}
      {summary?.leaders && summary.leaders.length > 0 && (
        <div id="headtohead" ref={headtoheadRef} className="scroll-mt-20 py-4">
          <h3 className="text-[#00ffe7] font-bold text-2xl mb-6 flex items-center gap-2">
            <FaChartBar />
            Head-to-Head Leaders
          </h3>
          
          <div className="space-y-4">
            {summary.leaders.map((teamLeaderGroup, teamIdx) => {
              const isHomeTeam = teamLeaderGroup.team.id === homeTeam?.id;
              const isAwayTeam = teamLeaderGroup.team.id === awayTeam?.id;
              
              if (!isHomeTeam && !isAwayTeam) return null;
              
              return (
                <div key={`team-leaders-${teamIdx}`}>
                  {teamLeaderGroup.leaders.map((category, catIdx) => {
                    // Find the corresponding category from the other team
                    const otherTeamGroup = summary.leaders.find(g => g.team.id !== teamLeaderGroup.team.id);
                    const otherCategory = otherTeamGroup?.leaders.find(c => c.name === category.name);
                    
                    if (!otherCategory || !category.leaders || !otherCategory.leaders || !category.leaders[0] || !otherCategory.leaders[0]) return null;
                    
                    const homeLeader = isHomeTeam ? category.leaders[0] : otherCategory.leaders[0];
                    const awayLeader = isAwayTeam ? category.leaders[0] : otherCategory.leaders[0];
                    
                    // Only render once (when processing the first team)
                    if (teamIdx !== 0) return null;
                    
                    return (
                      <div key={`category-${catIdx}`} className="bg-[#23263a]/50 rounded-lg p-4 border border-[#00ffe7]/10">
                        <h4 className="text-[#b0b7bf] font-semibold text-sm mb-4 text-center">{category.displayName}</h4>
                        
                        <div className="grid grid-cols-3 gap-4 items-center">
                          {/* Away Leader */}
                          <div 
                            className="flex flex-col items-center cursor-pointer hover:bg-[#00ffe7]/5 p-2 rounded transition-colors"
                            onClick={() => navigate(`/nfl/player/${awayLeader.athlete.id}`)}
                          >
                            <img 
                              src={awayLeader.athlete.headshot?.href || `https://robohash.org/${awayLeader.athlete.id}?set=set5`}
                              alt={awayLeader.athlete.displayName}
                              className="w-16 h-16 rounded-full mb-2 border-2 border-[#00ffe7]/30"
                              onError={(e) => {
                                e.currentTarget.src = `https://robohash.org/${awayLeader.athlete.id}?set=set5`;
                              }}
                            />
                            <p className="text-[#e0e7ef] font-semibold text-sm text-center">{awayLeader.athlete.displayName}</p>
                            <p className="text-[#b0b7bf] text-xs">#{awayLeader.athlete.jersey}</p>
                            {awayLeader.displayValue && (
                              <div className="mt-2 text-center">
                                {awayLeader.displayValue.split(',').map((stat, i) => (
                                  <p key={i} className="text-[#00ffe7] font-bold text-sm">{stat.trim()}</p>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* VS */}
                          <div className="flex items-center justify-center">
                            <span className="text-[#b0b7bf] text-sm font-bold">VS</span>
                          </div>
                          
                          {/* Home Leader */}
                          <div 
                            className="flex flex-col items-center cursor-pointer hover:bg-[#faafe8]/5 p-2 rounded transition-colors"
                            onClick={() => navigate(`/nfl/player/${homeLeader.athlete.id}`)}
                          >
                            <img 
                              src={homeLeader.athlete.headshot?.href || `https://robohash.org/${homeLeader.athlete.id}?set=set5`}
                              alt={homeLeader.athlete.displayName}
                              className="w-16 h-16 rounded-full mb-2 border-2 border-[#faafe8]/30"
                              onError={(e) => {
                                e.currentTarget.src = `https://robohash.org/${homeLeader.athlete.id}?set=set5`;
                              }}
                            />
                            <p className="text-[#e0e7ef] font-semibold text-sm text-center">{homeLeader.athlete.displayName}</p>
                            <p className="text-[#b0b7bf] text-xs">#{homeLeader.athlete.jersey}</p>
                            {homeLeader.displayValue && (
                              <div className="mt-2 text-center">
                                {homeLeader.displayValue.split(',').map((stat, i) => (
                                  <p key={i} className="text-[#faafe8] font-bold text-sm">{stat.trim()}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
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
      <div id="plays" ref={playsRef} className="scroll-mt-20 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#00ffe7] font-bold text-2xl flex items-center gap-2">
            <FaFootballBall />
            Play-by-Play Log
          </h3>
          {playLog.length > 0 && (
            <span className="text-[#b0b7bf] text-xs">
              {playLog.length} {playLog.length === 1 ? 'play' : 'plays'} recorded
            </span>
          )}
        </div>

        {playLog.length > 0 ? (
          <div className="relative">
            <div className="space-y-6">
              {(() => {
                // Group consecutive plays by possession
                const possessions: Array<{ possession?: string; plays: typeof playLog }> = [];
                for (let i = 0; i < playLog.length; i++) {
                  const p = playLog[i];
                  const last = possessions[possessions.length - 1];
                  
                  // If play has no possession, use the last known possession
                  const currentPossession = p.possession || last?.possession;
                  
                  if (!last || last.possession !== currentPossession) {
                    possessions.push({ possession: currentPossession, plays: [p] as any });
                  } else {
                    last.plays.push(p as any);
                  }
                }

                return possessions.map((group, groupIdx) => {
                  const team = group.possession === homeTeam?.id ? homeTeam : awayTeam;
                  const isHome = team?.id === homeTeam?.id;
                  const bgClass = isHome ? 'from-[#faafe8]/10 border-l-4 border-[#faafe8]' : 'from-[#00ffe7]/10 border-l-4 border-[#00ffe7]';

                  return (
                    <div key={`pos-${groupIdx}`} className={`bg-gradient-to-r ${bgClass} rounded-lg py-4 mb-4`}> 
                      <div className="flex items-center justify-between mb-3 px-4">
                        <div className="flex items-center gap-2">
                          <img src={team?.team.logo} alt="" className="w-8 h-8" />
                          <span className={`font-bold text-sm ${isHome ? 'text-[#faafe8]' : 'text-[#00ffe7]'}`}>
                            {team?.team.abbreviation} Possession
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">{group.plays.length} {group.plays.length === 1 ? 'play' : 'plays'}</div>
                      </div>

                      <div className="space-y-4 px-4">
                        {group.plays.map((play, idx) => {
                          const playText = play.text;
                          const parts = playText.split(/\\.\\n+\\s+(?=\\w)|(?=PENALTY)/g).filter(part => part.trim());
                          const isLatest = groupIdx === 0 && idx === 0;

                          return (
                            <div key={`${groupIdx}-${idx}`} className={`relative flex items-start gap-4 ${isLatest ? 'animate-[slide-in-play_0.5s_ease-out]' : ''}`}>
                              <div className="relative flex flex-col items-center flex-shrink-0" style={{ width: '48px' }}>
                                <div className={`w-4 h-4 rounded-full border-2 ${
                                  isLatest ? 'bg-[#00ffe7] border-[#00ffe7] animate-[pulse-dot_2s_ease-in-out_infinite]' : 'bg-[#23263a] border-[#00ffe7]/40'
                                } z-10`}></div>
                                <div className="text-center mt-1">
                                  <p className={`text-[10px] font-bold ${isLatest ? 'text-[#00ffe7]' : 'text-[#b0b7bf]'}`}>Q{play.quarter}</p>
                                  <p className={`text-[9px] font-mono ${isLatest ? 'text-[#00ffe7]' : 'text-[#b0b7bf]'}`}>{play.clock}</p>
                                </div>
                              </div>

                              <div className={`flex-1 pb-4 ${isLatest ? 'bg-[#00ffe7]/5 -ml-2 pl-2 pr-2 rounded-lg' : ''}`}>
                                <div className="space-y-1">
                                  {parts.map((part, partIdx) => {
                                    const trimmedPart = part.trim();
                                    const isTimeout = trimmedPart.toLowerCase().includes('timeout');
                                    return (
                                      <p key={partIdx} className={`text-sm ${isLatest ? 'text-[#e0e7ef] font-medium' : 'text-[#b0b7bf]'} flex items-center gap-2`}>
                                        {isTimeout && <FaPauseCircle className="text-yellow-400 flex-shrink-0" />}
                                        <span>{trimmedPart}{trimmedPart.endsWith('.') ? '' : '.'}</span>
                                      </p>
                                    );
                                  })}
                                </div>

                                {play.yardage !== undefined && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[#b0b7bf] text-xs">Yards:</span>
                                    <span className={`font-bold text-sm ${
                                      play.yardage > 0 ? 'text-green-400' : play.yardage < 0 ? 'text-red-400' : 'text-gray-400'
                                    }`}>{play.yardage > 0 ? '+' : ''}{play.yardage}</span>
                                  </div>
                                )}

                                {play.athletesInvolved && play.athletesInvolved.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {play.athletesInvolved.slice(0, 3).map((athlete) => (
                                      <div key={athlete.id} className="flex items-center gap-1 bg-[#1a1d2e]/30 rounded-full px-1.5 py-0.5">
                                        <img src={athlete.headshot} alt="" className="w-8 h-6 rounded-full" onError={(e) => e.currentTarget.style.display = 'none'} />
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
                    </div>
                  );
                });
              })()}
              
              {/* End of Game Marker */}
              <div className="relative flex items-start gap-4">
                <div className="relative flex flex-col items-center flex-shrink-0" style={{ width: '48px' }}>
                  <div className="w-4 h-4 rounded-full bg-[#faafe8] border-2 border-[#faafe8] shadow-[0_0_8px_rgba(250,175,232,0.6)] z-10"></div>
                  <p className="text-[10px] font-bold text-[#faafe8] mt-1">END</p>
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-sm text-[#b0b7bf] italic">
                    {competition.status.type.state === 'in' ? 'Game In Progress' : 'Game Complete'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[#b0b7bf] text-center text-sm py-4">No plays recorded yet. Plays will appear here as the game progresses.</p>
        )}
      </div>

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
    </>
  );
};

export default SummaryView;
