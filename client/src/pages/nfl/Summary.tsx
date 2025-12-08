import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrophy, FaChartBar, FaFootballBall, FaPauseCircle, FaClock } from 'react-icons/fa';
import Prediction from '@/components/nfl/Prediction';
import Boxscore from '@/pages/nfl/scoreboard/Boxscore';
import type { Summary } from '@/types/espn/summary';
import type { Event } from '@/types/espn/scoreboard';

interface SummaryViewProps {
  event: Event;
  summary: Summary | null;
  activeTab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays' | 'odds' | 'pick';
  onTabChange: (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays' | 'odds' | 'pick') => void;
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
  gameId: string;
}

const SummaryView: React.FC<SummaryViewProps> = ({
  event,
  summary,
  activeTab,
  onTabChange,
  getTeamLogo,
  playLog,
  gameId
}) => {
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [timeUntilGame, setTimeUntilGame] = useState<string>('');

  const competition = event.competitions[0];
  const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
  const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
  const gameStatus = competition.status.type.state;
  const isPreGame = gameStatus === 'pre';

  // Countdown timer for pre-game
  useEffect(() => {
    if (!isPreGame) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const gameTime = new Date(competition.date).getTime();
      const distance = gameTime - now;

      if (distance < 0) {
        setTimeUntilGame('Starting soon');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeUntilGame(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeUntilGame(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeUntilGame(`${minutes}m ${seconds}s`);
      } else {
        setTimeUntilGame(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [isPreGame, competition.date]);

  // Get tab index for carousel position
  const getTabIndex = (tab: string) => {
    const summaryTabs = ['info', 'player', 'headtohead', 'team', 'plays', 'prediction'];
    return summaryTabs.indexOf(tab);
  };

  // Update carousel position when tab changes
  useEffect(() => {
    if (carouselRef.current) {
      const index = getTabIndex(activeTab);
      if (index !== -1) {
        const slidePercentage = 100 / 6;
        carouselRef.current.style.transform = `translateX(-${index * slidePercentage}%)`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [activeTab]);

  return (
    <div className="pb-24">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Carousel Container */}
        <div className="overflow-hidden relative">
          <div
            ref={carouselRef}
            className="flex transition-transform duration-500 ease-in-out"
            style={{ width: '600%' }}
          >
            {/* Info Section */}
            <div className="w-full flex-shrink-0 space-y-6 py-6 max-h-screen" style={{ width: '16.666%' }}>
              {/* Box Score */}
              <div className="mb-6">
                {/* Boxscore Component */}
                <Boxscore 
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  competition={competition}
                  getTeamLogo={getTeamLogo}
                  gameDate={competition.date}
                />
              </div>

              {/* Line Scores */}
              {(homeTeam?.linescores || awayTeam?.linescores) && (
                <div className="p-2 mb-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#00ffe7]/20">
                          <th className="text-left text-[#b0b7bf] font-semibold py-2">Team</th>
                          {[1, 2, 3, 4].map(q => (
                            <th key={q} className="text-center text-[#b0b7bf] font-semibold py-2">Q{q}</th>
                          ))}
                          {(homeTeam?.linescores?.length ?? 0) > 4 && (
                            <th className="text-center text-[#b0b7bf] font-semibold py-2">OT</th>
                          )}
                          <th className="text-center text-[#b0b7bf] font-semibold py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-[#00ffe7]/10">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <img src={getTeamLogo(awayTeam?.team)} alt={awayTeam?.team.abbreviation} className="w-6 h-6" />
                              <span className="text-[#e0e7ef] font-bold">{awayTeam?.team.abbreviation}</span>
                            </div>
                          </td>
                          {awayTeam?.linescores?.map((score, idx) => (
                            <td key={idx} className="text-center text-[#e0e7ef] py-3">{score.displayValue}</td>
                          ))}
                          <td className="text-center text-[#00ffe7] font-bold py-3">{awayTeam?.score}</td>
                        </tr>
                        <tr>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <img src={getTeamLogo(homeTeam?.team)} alt={homeTeam?.team.abbreviation} className="w-6 h-6" />
                              <span className="text-[#e0e7ef] font-bold">{homeTeam?.team.abbreviation}</span>
                            </div>
                          </td>
                          {homeTeam?.linescores?.map((score, idx) => (
                            <td key={idx} className="text-center text-[#e0e7ef] py-3">{score.displayValue}</td>
                          ))}
                          <td className="text-center text-[#faafe8] font-bold py-3">{homeTeam?.score}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Venue & Game Information */}
              <div className="overflow-hidden">
                {/* Venue image if available from summary */}
                {summary?.gameInfo?.venue?.images && summary.gameInfo.venue.images.length > 0 && (
                  <div className="relative h-24 overflow-hidden mb-4">
                    <img 
                      src={summary.gameInfo.venue.images[0].href}
                      alt="Venue"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#181a23]" />
                    <div className="absolute bottom-2 left-4">
                      <h4 className="text-[#00ffe7] font-bold text-sm flex items-center gap-1">
                        <FaFootballBall className="text-xs" />
                        {summary.gameInfo.venue.fullName || competition.venue?.fullName}
                      </h4>
                      <p className="text-[#e0e7ef] text-xs">
                        {summary.gameInfo.venue.address?.city || competition.venue?.address?.city}, {summary.gameInfo.venue.address?.state || competition.venue?.address?.state}
                      </p>
                    </div>
                  </div>
                )}

                {competition.venue && (
                  <div className="p-4">
                    {!summary?.gameInfo?.venue?.images?.length && (
                      <div className="mb-3">
                        <h4 className="text-[#00ffe7] font-bold text-sm flex items-center gap-1 mb-1">
                          <FaFootballBall className="text-xs" />
                          {competition.venue.fullName}
                        </h4>
                        {competition.venue.address && (
                          <p className="text-[#e0e7ef] text-xs">
                            {competition.venue.address.city}, {competition.venue.address.state}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Game Info Grid */}
                    <div className="bg-[#23263a]/50 rounded-lg p-3 border border-[#00ffe7]/10">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                        {summary?.gameInfo?.attendance && (
                          <>
                            <span className="text-[#b0b7bf]">Attendance:</span>
                            <span className="text-[#e0e7ef] font-semibold">{summary.gameInfo.attendance.toLocaleString()}</span>
                          </>
                        )}
                        {!summary?.gameInfo?.attendance && competition.attendance && (
                          <>
                            <span className="text-[#b0b7bf]">Attendance:</span>
                            <span className="text-[#e0e7ef] font-semibold">{competition.attendance.toLocaleString()}</span>
                          </>
                        )}
                        {competition.broadcasts && competition.broadcasts.length > 0 && (
                          <>
                            <span className="text-[#b0b7bf]">Network:</span>
                            <span className="text-[#e0e7ef] font-semibold">{competition.broadcasts[0].names?.[0] || competition.broadcasts[0].market}</span>
                          </>
                        )}
                        {competition.notes && competition.notes.length > 0 && (
                          <>
                            <span className="text-[#b0b7bf]">Notes:</span>
                            <span className="text-[#e0e7ef] font-semibold">{competition.notes[0].headline}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Player Statistics Section */}
            <div className="w-full flex-shrink-0 py-6 max-h-screen" style={{ width: '16.666%' }}>
              <h3 className="text-[#00ffe7] font-bold text-2xl mb-6 flex items-center gap-2">
                <FaTrophy />
                Player Statistics
              </h3>

              {summary?.boxscore?.players && summary.boxscore.players.length > 0 ? (
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

            {/* Head-to-Head Section */}
            <div className="w-full flex-shrink-0 py-6 max-h-screen" style={{ width: '16.666%' }}>
              <h3 className="text-[#00ffe7] font-bold text-2xl mb-6 flex items-center gap-2">
                <FaChartBar />
                Head-to-Head Leaders
              </h3>

              {summary?.leaders && summary.leaders.length > 0 ? (
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
              ) : (
                <p className="text-[#b0b7bf] text-center py-8">Head-to-head statistics will be available after the game.</p>
              )}
            </div>

            {/* Team Stats Section */}
            <div className="w-full flex-shrink-0 py-6 max-h-screen" style={{ width: '16.666%' }}>
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
            <div className="w-full flex-shrink-0 py-6 max-h-screen" style={{ width: '16.666%' }}>
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
                                {team && (
                                  <img src={getTeamLogo(team.team)} alt="" className="w-8 h-8" />
                                )}
                                <span className={`font-bold text-sm ${isHome ? 'text-[#faafe8]' : 'text-[#00ffe7]'}`}>
                                  {team?.team.abbreviation} Possession
                                </span>
                              </div>
                              <div className="text-xs text-gray-400">{group.plays.length} {group.plays.length === 1 ? 'play' : 'plays'}</div>
                            </div>

                            <div className="space-y-4 px-4">
                              {group.plays.map((play, idx) => {
                                const isLatest = groupIdx === 0 && idx === 0;

                                return (
                                  <div key={`${groupIdx}-${idx}`} className={`relative flex items-start gap-4 ${isLatest ? 'animate-[slide-in-play_0.5s_ease-out]' : ''}`}>
                                    <div className="relative flex flex-col items-center flex-shrink-0" style={{ width: '48px' }}>
                                      <div className={`w-4 h-4 rounded-full border-2 ${isLatest ? 'bg-[#00ffe7] border-[#00ffe7] animate-[pulse-dot_2s_ease-in-out_infinite]' : 'bg-[#23263a] border-[#00ffe7]/40'
                                        } z-10`}></div>
                                      <div className="text-center mt-1">
                                        <p className={`text-[10px] font-bold ${isLatest ? 'text-[#00ffe7]' : 'text-[#b0b7bf]'}`}>Q{play.quarter}</p>
                                        <p className={`text-[9px] font-mono ${isLatest ? 'text-[#00ffe7]' : 'text-[#b0b7bf]'}`}>{play.clock}</p>
                                      </div>
                                    </div>

                                    <div className={`flex-1 pb-4 ${isLatest ? 'bg-[#00ffe7]/5 -ml-2 pl-2 pr-2 rounded-lg' : ''}`}>
                                      <p className={`text-sm ${isLatest ? 'text-[#e0e7ef] font-medium' : 'text-[#b0b7bf]'}`}>
                                        {play.text}
                                      </p>

                                      {play.yardage !== undefined && (
                                        <div className="flex items-center gap-2 mt-2">
                                          <span className="text-[#b0b7bf] text-xs">Yards:</span>
                                          <span className={`font-bold text-sm ${play.yardage > 0 ? 'text-green-400' : play.yardage < 0 ? 'text-red-400' : 'text-gray-400'
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
            <div className="w-full flex-shrink-0 py-6 max-h-screen" style={{ width: '16.666%' }}>
              {homeTeam && awayTeam && (
                <Prediction
                  gameId={gameId}
                  competitionId={competition.id}
                  homeTeamInfo={{
                    name: homeTeam.team.displayName,
                    logo: getTeamLogo(homeTeam),
                    color: homeTeam.team.color || '00ffe7'
                  }}
                  awayTeamInfo={{
                    name: awayTeam.team.displayName,
                    logo: getTeamLogo(awayTeam),
                    color: awayTeam.team.color || 'faafe8'
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryView;
