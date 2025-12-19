import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrophy, FaChartBar, FaFootballBall, FaPauseCircle, FaClock, FaLock, FaCheckCircle, FaBolt, FaChartLine, FaUsers } from 'react-icons/fa';
import PredictionChart from '@/components/nfl/PredictionChart';
import PlayLog from '@/components/nfl/PlayLog';
import PointsChart from '@/components/nfl/PointsChart';
import axios from 'axios';
import Info from '@/pages/nfl/scoreboard/Info';
import YourPicks from '@/pages/nfl/scoreboard/YourPicks';
import TopPicks from '@/pages/nfl/scoreboard/TopPicks';
import { useAuth } from '@/providers/AuthContext';
import type { Summary } from '@/types/espn/summary';
import type { Event } from '@/types/espn/scoreboard';
import { Play } from '@/types/espn/playByplay';

interface SummaryViewProps {
  event: Event;
  summary: Summary | null;
  activeTab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays' | 'odds' | 'pick' | 'top' | 'yourpicks' | 'schedule' | 'news' | 'dashboard' | 'games';
  onTabChange: (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays' | 'odds' | 'pick' | 'top' | 'yourpicks' | 'schedule' | 'news' | 'dashboard' | 'games') => void;
  getTeamLogo: (team: any) => string;
  playLog: Play[];
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
  const { isAuthenticated, triggerLoginModal } = useAuth();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [timeUntilGame, setTimeUntilGame] = useState<string>('');
  const [gameCountdown, setGameCountdown] = useState<number>(0);
  const [isPickExpanded, setIsPickExpanded] = useState(true);
  const [apiPlayLog, setApiPlayLog] = useState<Play[]>([]);

  const competition = event.competitions[0];
  const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
  const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
  const gameStatus = competition.status.type.state;
  const isPreGame = gameStatus === 'pre';
  // Build a quick player headshot lookup from boxscore players
  const headshotByAthleteId = React.useMemo(() => {
    const map = new Map<string, string>();
    const players = summary?.boxscore?.players || [];
    players.forEach(teamData => {
      teamData.statistics.forEach(cat => {
        cat.athletes.forEach(a => {
          const hs = (a.athlete as any)?.headshot;
          const url = typeof hs === 'string' ? hs : hs?.href;
          if (a.athlete.id && url) {
            map.set(a.athlete.id, url);
          }
        });
      });
    });
    return map;
  }, [summary?.boxscore?.players]);
  
  // Fetch authoritative play-by-play from backend API and normalize
  useEffect(() => {
    const fetchPlayByPlay = async () => {
      try {
        const res = await axios.get(`/api/playbyplay/${event.id}`);
        const data = res.data;
        const normalized: Play[] = [];

        if (data?.drives?.previous?.length) {
          data.drives.previous.forEach((drive: any) => {
            drive.plays?.forEach((p: any) => {
              const possessionTeamId = p.start?.team?.id || drive.team?.id;
              normalized.push({
                text: p.text,
                quarter: p.period?.number || 0,
                clock: p.clock?.displayValue || '',
                yardage: typeof p.statYardage === 'number' ? p.statYardage : undefined,
                timestamp: new Date(p.wallclock || competition.date),
                possession: possessionTeamId,
                type: p.type?.text || 'Play',
                athletesInvolved: (p.athletesInvolved || []).map((a: any) => ({
                  id: a.athlete?.id || a.id,
                  fullName: a.athlete?.displayName || a.fullName || a.displayName,
                  displayName: a.athlete?.displayName || a.displayName,
                  shortName: a.athlete?.shortName || a.shortName || a.displayName,
                  headshot:
                    a.athlete?.headshot?.href || a.headshot || (a.athlete?.id ? headshotByAthleteId.get(a.athlete.id) : '') || '',
                  jersey: a.athlete?.jersey || a.jersey || '',
                  position: a.athlete?.position?.abbreviation || a.position || '',
                  team: { id: a.athlete?.team?.id || (p.start?.team?.id) || possessionTeamId },
                })),
              });
            });
          });
        } else if (Array.isArray(data?.plays)) {
          data.plays.forEach((p: any) => {
            normalized.push({
              text: p.text,
              quarter: p.period?.number || p.quarter || 0,
              clock: p.clock?.displayValue || p.clock || '',
              yardage: typeof p.statYardage === 'number' ? p.statYardage : p.yardage,
              timestamp: new Date(p.wallclock || competition.date),
              possession: p.start?.team?.id || p.possession,
              type: p.type?.text || p.type || 'Play',
              athletesInvolved: (p.athletesInvolved || []).map((a: any) => ({
                id: a.athlete?.id || a.id,
                fullName: a.athlete?.displayName || a.fullName || a.displayName,
                displayName: a.athlete?.displayName || a.displayName,
                shortName: a.athlete?.shortName || a.shortName || a.displayName,
                headshot:
                  a.athlete?.headshot?.href || a.headshot || (a.athlete?.id ? headshotByAthleteId.get(a.athlete.id) : '') || '',
                jersey: a.athlete?.jersey || a.jersey || '',
                position: a.athlete?.position?.abbreviation || a.position || '',
                team: { id: a.athlete?.team?.id || (p.start?.team?.id) || p.teamId || '' },
              })),
            });
          });
        }

        setApiPlayLog(normalized);
      } catch (err) {
        console.warn('Failed to fetch play-by-play from backend:', err);
      }
    };
    fetchPlayByPlay();
  }, [event.id, competition.date, headshotByAthleteId]);
  // Build a unified play log: use drives for completed games, else use provided playLog
  const effectivePlayLog = React.useMemo(() => {
    const state = competition.status.type.state;
    if (apiPlayLog.length > 0) {
      return apiPlayLog;
    }
    if (state === 'post' && summary?.drives?.previous && summary.drives.previous.length > 0) {
      const plays: Play[] = [];

      summary.drives.previous.forEach((drive) => {
        drive.plays.forEach((p: any) => {
          const possessionTeamId = p.start?.team?.id || drive.team?.id;
          plays.push({
            text: p.text,
            quarter: p.period?.number || 0,
            clock: p.clock?.displayValue || '',
            yardage: typeof p.statYardage === 'number' ? p.statYardage : undefined,
            timestamp: new Date(p.wallclock || competition.date),
            possession: possessionTeamId,
            type: p.type?.text || 'Play',
            athletesInvolved: (p.athletesInvolved || [])
              .map((a: any) => ({
                id: a.athlete?.id || a.id,
                fullName: a.athlete?.displayName || a.fullName || a.displayName,
                displayName: a.athlete?.displayName || a.displayName,
                shortName: a.athlete?.shortName || a.shortName || a.displayName,
                headshot: a.athlete?.headshot?.href || a.headshot || (a.athlete?.id ? headshotByAthleteId.get(a.athlete.id) : '') || '',
                jersey: a.athlete?.jersey || a.jersey || '',
                position: a.athlete?.position?.abbreviation || a.position || '',
                team: { id: a.athlete?.team?.id || (p.start?.team?.id) || possessionTeamId },
              }))
          });
        });
      });

      return plays;
    }
    return playLog;
  }, [competition.status.type.state, summary?.drives, playLog, competition.date, apiPlayLog]);

  // Extract scoring plays from play log
  const scoringPlays = React.useMemo(() => {
    const plays: Array<{
      text: string;
      quarter: number;
      clock: string;
      timestamp: Date;
      homeScore?: number;
      awayScore?: number;
    }> = [];
    
    let currentHomeScore = 0;
    let currentAwayScore = 0;
    
    effectivePlayLog.forEach((play) => {
      const text = play.text.toLowerCase();
      const isScoring = 
        text.includes('touchdown') || 
        text.includes('field goal') || 
        text.includes('safety') ||
        text.includes('extra point') ||
        text.includes('two point') ||
        text.includes('pat ');
      
      if (isScoring) {
        // Determine which team scored based on possession
        const isHomeTeamPlay = play.possession === homeTeam?.id;
        
        // Calculate points based on play text
        let points = 0;
        if (text.includes('touchdown')) points = 6;
        else if (text.includes('field goal')) points = 3;
        else if (text.includes('safety')) points = 2;
        else if (text.includes('extra point') || text.includes('pat ')) points = 1;
        else if (text.includes('two point')) points = 2;
        
        // Update scores
        if (isHomeTeamPlay) {
          currentHomeScore += points;
        } else {
          currentAwayScore += points;
        }
        
        plays.push({
          text: play.text,
          quarter: play.quarter,
          clock: play.clock,
          timestamp: typeof play.timestamp === 'string' ? new Date(play.timestamp) : play.timestamp,
          homeScore: currentHomeScore,
          awayScore: currentAwayScore
        });
      }
    });
    
    return plays;
  }, [effectivePlayLog, homeTeam?.id]);

  // Countdown timer for pre-game
  useEffect(() => {
    if (!isPreGame) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const gameTime = new Date(competition.date).getTime();
      const distance = gameTime - now;

      setGameCountdown(Math.max(0, distance));

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
    const summaryTabs = isPreGame
      ? ['info', 'pick']
      : ['info', 'pick', 'player', 'plays'];
    return summaryTabs.indexOf(tab);
  };

  // Update carousel position when tab changes
  useEffect(() => {
    if (carouselRef.current) {
      const index = getTabIndex(activeTab);
      if (index !== -1) {
        const totalSlides = isPreGame ? 2 : 4;
        const slidePercentage = 100 / totalSlides;
        carouselRef.current.style.transform = `translateX(-${index * slidePercentage}%)`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [activeTab, isPreGame]);

  return (
    <div className="">
      <div className="max-w-7xl mx-auto">
        {/* Carousel Container */}
        <div className="overflow-hidden relative">
          <div
            ref={carouselRef}
            className="flex transition-transform duration-500 ease-in-out"
            style={{ width: isPreGame ? '200%' : '400%' }}
          >
            {/* Info Section */}
            <div className="w-full flex-shrink-0 h-[calc(100dvh-72px)] space-y-6 py-4 overflow-y-auto" style={{ width: isPreGame ? '50%' : '25%' }}>
              <Info
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                competition={competition}
                getTeamLogo={getTeamLogo}
                gameCountdown={gameCountdown}
                playLog={effectivePlayLog}
                summary={summary}
                gameId={gameId}
              />
              
              {/* Points Chart - Show for all games with scoring data */}
              {scoringPlays.length > 0 && (
                <div className="mt-4">
                  <div className="border-t-2 border-[#00ffe7]/20 pt-2 mb-4"></div>
                  <div className="mx-2">
                    <PointsChart
                      gameId={gameId}
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
                      scoringPlays={scoringPlays}
                      gameStatus={competition.status.type.state}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Pick Section - Your Picks (moved to 2nd position) */}
            {!isPreGame && (
            <div className="w-full flex-shrink-0  overflow-hidden" style={{ width: '25%' }}>
              {!isAuthenticated ? (
                // Login Prompt - Advertisement Style
                <div className="h-[calc(100%-64px)] flex items-center justify-center px-6">
                  <div className="max-w-md w-full">
                    {/* Hero Section */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00ffe7]/20 via-[#1a1d2e] to-[#faafe8]/20 border-2 border-[#00ffe7]/40 shadow-[0_0_30px_rgba(0,255,231,0.3)] p-6 sm:p-8">
                      {/* Animated background elements */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ffe7]/10 rounded-full blur-3xl animate-pulse"></div>
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#faafe8]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                      
                      <div className="relative z-10">
                        {/* Lock Icon */}
                        <div className="flex justify-center mb-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-[#00ffe7] blur-xl opacity-50 animate-pulse"></div>
                            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#00ffe7] to-[#faafe8] flex items-center justify-center shadow-lg">
                              <FaLock className="text-[#1a1d2e] text-2xl" />
                            </div>
                          </div>
                        </div>

                        {/* Headline */}
                        <h1>
                          Unlock Your Picks
                        </h1>
                        <p className="text-[#b0b7bf] text-center text-base mb-6">
                          Join the game and start making your predictions!
                        </p>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#00ffe7]/5 border border-[#00ffe7]/20">
                            <div className="w-8 h-8 rounded-lg bg-[#00ffe7]/20 flex items-center justify-center flex-shrink-0">
                              <FaCheckCircle className="text-[#00ffe7] text-base" />
                            </div>
                            <div>
                              <h3 className="text-[#e0e7ef] font-bold text-sm mb-0.5">Track Your Picks</h3>
                              <p className="text-[#b0b7bf] text-xs">Follow predictions in real-time</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#faafe8]/5 border border-[#faafe8]/20">
                            <div className="w-8 h-8 rounded-lg bg-[#faafe8]/20 flex items-center justify-center flex-shrink-0">
                              <FaBolt className="text-[#faafe8] text-base" />
                            </div>
                            <div>
                              <h3 className="text-[#e0e7ef] font-bold text-sm mb-0.5">Live Updates</h3>
                              <p className="text-[#b0b7bf] text-xs">Instant player scoring alerts</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#00ffe7]/5 border border-[#00ffe7]/20">
                            <div className="w-8 h-8 rounded-lg bg-[#00ffe7]/20 flex items-center justify-center flex-shrink-0">
                              <FaChartLine className="text-[#00ffe7] text-base" />
                            </div>
                            <div>
                              <h3 className="text-[#e0e7ef] font-bold text-sm mb-0.5">Performance Stats</h3>
                              <p className="text-[#b0b7bf] text-xs">Track prediction accuracy</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#faafe8]/5 border border-[#faafe8]/20">
                            <div className="w-8 h-8 rounded-lg bg-[#faafe8]/20 flex items-center justify-center flex-shrink-0">
                              <FaUsers className="text-[#faafe8] text-base" />
                            </div>
                            <div>
                              <h3 className="text-[#e0e7ef] font-bold text-sm mb-0.5">Compete & Compare</h3>
                              <p className="text-[#b0b7bf] text-xs">See top picks and compete</p>
                            </div>
                          </div>
                        </div>

                        {/* CTA Button */}
                        <button
                          onClick={() => triggerLoginModal()}
                          className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#00ffe7] to-[#faafe8] text-[#1a1d2e] font-bold text-base shadow-[0_0_20px_rgba(0,255,231,0.5)] hover:shadow-[0_0_30px_rgba(0,255,231,0.7)] transform hover:scale-105 transition-all duration-200"
                        >
                          Sign In to Start Picking
                        </button>

                        <p className="text-[#b0b7bf] text-center text-xs mt-3">
                          Free to join • No credit card required
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Authenticated - Show TopPicks for completed games, YourPicks for others
                homeTeam?.id && awayTeam?.id && (
                  gameStatus === 'post' ? (
                    <TopPicks
                      gameId={event.id}
                      homeTeamId={homeTeam.id}
                      awayTeamId={awayTeam.id}
                      playLog={effectivePlayLog}
                      getTeamLogo={getTeamLogo}
                      homeTeam={homeTeam}
                      awayTeam={awayTeam}
                      isGameInSession={false}
                    />
                  ) : (
                    <YourPicks
                      gameId={event.id}
                      homeTeamId={homeTeam.id}
                      awayTeamId={awayTeam.id}
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
                      isExpanded={isPickExpanded}
                      onToggle={() => setIsPickExpanded(!isPickExpanded)}
                      playLog={playLog}
                      situation={competition.situation}
                      homeTeam={homeTeam}
                      awayTeam={awayTeam}
                      getTeamLogo={getTeamLogo}
                    />
                  )
                )
              )}
            </div>
            )}

            {/* Player Statistics Section */}
            {!isPreGame && (
            <div className="w-full flex-shrink-0 h-[calc(100dvh-72px)] py-6 overflow-y-auto" style={{ width: '25%' }}>
              {/* Divider */}
              <div className="border-t-2 border-[#00ffe7]/20 pt-2 mb-4"></div>
              <div className="mx-2">
                <div className="flex items-center mb-6 pb-3 border-b border-[#00ffe7]/10">
                  <h1>Player Statistics</h1>
                </div>
              </div>

              <div className="mx-2">
                {summary?.boxscore?.players && summary.boxscore.players.length > 0 ? (
                  <div className="space-y-8">
                  {summary.boxscore.players.map((teamData: any, teamIdx: number) => ( 

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
                      {teamData.statistics.map((category: any, catIdx: number) => (
                        <div key={`${teamData.team.id}-${category.name}-${catIdx}`} className="bg-[#23263a]/50 rounded-lg p-2 sm:p-4 border border-[#00ffe7]/10">
                          <h5 className="text-[#b0b7bf] font-semibold text-xs sm:text-sm mb-2">{category.text}</h5>

                          {/* Table for player stats */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs sm:text-sm">
                              <thead>
                                <tr className="border-b border-[#00ffe7]/10">
                                  <th className="text-left py-2 px-1 sm:px-2 text-[#b0b7bf] font-semibold">Player</th>
                                  {category.labels.map((label: any, labelIdx: number) => (
                                    <th key={`label-${labelIdx}`} className="text-center py-2 px-1 sm:px-2 text-[#b0b7bf] font-semibold whitespace-nowrap">
                                      {label}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {category.athletes.map((athleteData: any, athleteIdx: number) => (
                                  <tr
                                    key={`${athleteData.athlete.id}-${athleteIdx}`}
                                    className="border-b border-[#00ffe7]/5 hover:bg-[#00ffe7]/5 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/nfl/player/${athleteData.athlete.id}`)}
                                  >
                                    <td className="py-2 px-1 sm:px-2">
                                      <div className="flex items-center gap-1 sm:gap-2">
                                        {(() => {
                                          const headshot = athleteData.athlete.headshot;
                                          const headshotUrl = typeof headshot === 'string' ? headshot : headshot?.href;
                                          return headshotUrl ? (
                                            <img
                                              src={headshotUrl}
                                              alt={athleteData.athlete.displayName}
                                              className="w-7 h-6 sm:w-8 sm:h-8 rounded-full"
                                            />
                                          ) : (
                                            <div className="w-7 h-6 sm:w-8 sm:h-8 rounded-full bg-[#23263a] flex items-center justify-center">
                                              <FaFootballBall className="text-[#00ffe7] text-xs" />
                                            </div>
                                          );
                                        })()}
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
                                    {athleteData.stats.map((stat: any, statIdx: number) => (
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
                                    {category.totals.map((total: any, totalIdx: number) => (
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
            </div>
            )}

            {/* Plays Section - Drive by Drive */}
            {!isPreGame && (
            <div className="w-full flex-shrink-0 h-[calc(100dvh-72px)] py-6 overflow-y-auto" style={{ width: '25%' }}>
              {/* Divider */}
              <div className="border-t-2 border-[#00ffe7]/20 pt-2 mb-4"></div>
              <div className="mx-2">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#00ffe7]/10">
                  <h1>Plays</h1>
                  {playLog.length > 0 && (
                    <span className="text-[#b0b7bf] text-xs">
                      {playLog.length} {playLog.length === 1 ? 'play' : 'plays'} recorded
                    </span>
                  )}
                </div>
              </div>

              {/* Always use the PlayLog component for consistency */}
              <div className="mx-2">
                <div className="relative">
                  <div className="space-y-6">
                    <PlayLog
                      playLog={effectivePlayLog}
                      homeTeam={homeTeam as any}
                      awayTeam={awayTeam as any}
                      getTeamLogo={getTeamLogo}
                      title="Plays"
                      showTitle={false}
                    />
                  </div>
                </div>
              </div>
            </div>

            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryView;
