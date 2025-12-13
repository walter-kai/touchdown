import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrophy, FaFootballBall, FaChartBar, FaClock, FaPauseCircle } from 'react-icons/fa';
import HeadToHead from '@/components/nfl/HeadToHead';
import ProbChart from '@/components/nfl/ProbabilityChart';
import YourPicks from '@/pages/nfl/scoreboard/YourPicks';
import Boxscore from '@/pages/nfl/scoreboard/Boxscore';
import TopPicks from '@/pages/nfl/scoreboard/TopPicks';
import FootballField from '@/components/nfl/FootballField';
import GameLeaders from '@/pages/nfl/summary/GameLeaders';
import PlayLog from '@/components/nfl/PlayLog';
import type { Event } from '@/types/espn/scoreboard';

interface ScoreboardViewProps {
  event: Event;
  activeTab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays' | 'odds' | 'pick' | 'yourpicks' | 'schedule' | 'news';
  onTabChange: (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays' | 'odds' | 'pick' | 'yourpicks' | 'schedule' | 'news') => void;
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
  lastUpdated: Date | null;
  countdown: number;
  isRefreshing: boolean;
  onManualRefresh: () => void;
}

const ScoreboardView: React.FC<ScoreboardViewProps> = ({
  event,
  activeTab,
  onTabChange,
  getTeamLogo,
  playLog,
  lastUpdated,
  countdown,
  isRefreshing,
  onManualRefresh
}) => {
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isPickExpanded, setIsPickExpanded] = useState(true); // Default to true so picker is visible
  const [gameCountdown, setGameCountdown] = useState<number>(0);
  
  const competition = event.competitions[0];
  const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
  const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
  const isGameInSession = competition.status.type.state === 'in';
  const isGameUpcoming = competition.status.type.state === 'pre';

  // Get tab index for carousel position
  const getTabIndex = (tab: string) => {
    const scoreboardTabs = isGameUpcoming
      ? ['info', 'odds', 'headtohead']
      : ['info', 'pick', 'player', 'odds', 'headtohead'];
    return scoreboardTabs.indexOf(tab);
  };

  // Update carousel position when tab changes
  useEffect(() => {
    if (carouselRef.current) {
      const index = getTabIndex(activeTab);
      if (index !== -1) {
        const totalSlides = isGameUpcoming ? 3 : 5;
        const slidePercentage = 100 / totalSlides;
        carouselRef.current.style.transform = `translateX(-${index * slidePercentage}%)`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [activeTab, isGameUpcoming]);

  // Rotate sentences for latest play display
  useEffect(() => {
    if (playLog.length === 0) return;
    const latestPlay = playLog[0];
    const sentences = latestPlay.text.split(/\.\s+/).filter(s => s.trim());
    if (sentences.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSentenceIndex(prev => (prev + 1) % sentences.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [playLog]);

  // Update game countdown timer for pre-game state
  useEffect(() => {
    if (competition.status.type.state === 'pre') {
      const updateCountdown = () => {
        const now = new Date();
        const gameTime = new Date(competition.date);
        const diff = Math.max(0, gameTime.getTime() - now.getTime());
        setGameCountdown(diff);
      };
      
      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);
      return () => clearInterval(timer);
    }
  }, [competition.date, competition.status.type.state]);

  return (
    <div className="pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Carousel Container */}
        <div className="overflow-hidden relative">
          <div
            ref={carouselRef}
            className="flex transition-transform duration-500 ease-in-out"
            style={{ width: isGameUpcoming ? '300%' : '500%' }}
          >
            {/* Info Section - Game Overview */}
            <div className="w-full flex-shrink-0 py-4 overflow-y-auto min-h-screen" style={{ width: isGameUpcoming ? '33.333%' : '20%' }}>

              <div className='mx-2'>
                {/* Box Score */}

                  {/* Boxscore Component */}
                  <Boxscore
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    competition={competition}
                    getTeamLogo={getTeamLogo}
                    gameCountdown={gameCountdown}
                    gameDate={competition.date}
                  />
</div>
             
                {/* Live Game Situation */}
                {competition.situation && competition.status.type.state === 'in' && (
                  <div className="space-y-4">
                    {/* Football Field Visualization */}
                    {competition.situation.lastPlay && (
                      <div className="">
                        {/* Field Visualization */}
                        <div className="pt-2 ">
                            <div className='mx-2'>
                              <FootballField
                                homeTeam={homeTeam}
                                awayTeam={awayTeam}
                                lastPlay={competition.situation.lastPlay}
                                getTeamLogo={getTeamLogo}
                              />
                              {/* Timeouts */}
                              <div className="flex justify-between items-center pt-4">
                                <div className="text-center">
                                  <p className="text-[#b0b7bf] text-xs mb-1">{awayTeam?.team.abbreviation} Timeouts</p>
                                  <div className="flex gap-1 justify-center">
                                    {[...Array(3)].map((_, i) => (
                                      <div
                                        key={i}
                                        className={`w-3 h-3 rounded-full ${
                                          i < ((competition.situation?.awayTimeouts ?? 3))
                                            ? 'bg-[#00ffe7]'
                                            : 'bg-gray-600'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <p className="text-[#b0b7bf] text-xs mb-1">{homeTeam?.team.abbreviation} Timeouts</p>
                                  <div className="flex gap-1 justify-center">
                                    {[...Array(3)].map((_, i) => (
                                      <div
                                        key={i}
                                        className={`w-3 h-3 rounded-full ${
                                          i < ((competition.situation?.homeTimeouts ?? 3))
                                            ? 'bg-[#faafe8]'
                                            : 'bg-gray-600'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Play Log */}
                              <div className="mt-4">
                                <PlayLog
                                  playLog={playLog}
                                  homeTeam={homeTeam}
                                  awayTeam={awayTeam}
                                  getTeamLogo={getTeamLogo}
                                  title="Play Log"
                                  showTitle={true}
                                />
                              </div>
                            </div>
                            {/* Game Leaders */}
                            <div className="mt-4">
                              {/* <GameLeaders
                                summary={event.competitions[0].summary || null}
                                homeTeamId={event.competitions[0].competitors.find(c => c.homeAway === 'home')?.id}
                                awayTeamId={event.competitions[0].competitors.find(c => c.homeAway === 'away')?.id}
                              /> */}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
 
              {/* Pre-game or Post-game Info */}
              {competition.status.type.state !== 'in' && (
                <div className="text-center">
                    {/* Line Scores */}
                    {(homeTeam?.linescores || awayTeam?.linescores) && (
                      <div className="p-2">
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
                                    <img src={getTeamLogo(awayTeam?.team)} alt={awayTeam?.team.abbreviation} className="w-7 h-6" />
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
                                    <img src={getTeamLogo(homeTeam?.team)} alt={homeTeam?.team.abbreviation} className="w-7 h-6" />
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
                  </div>
                )}

              {/* End of Info Section  */}
            </div>

            {/* Pick Section - Top Picks & Your Picks */}
            {!isGameUpcoming && (
              <div className="w-full flex-shrink-0 overflow-y-auto min-h-screen" style={{ width: '20%' }}>
                {/* Top Picks - All Players Who Scored */}
                {homeTeam?.id && awayTeam?.id && (
                  <div className="">
                    <TopPicks
                      homeTeamId={homeTeam.id}
                      awayTeamId={awayTeam.id}
                      playLog={playLog}
                      getTeamLogo={getTeamLogo}
                      homeTeam={homeTeam}
                      awayTeam={awayTeam}
                    />
                  </div>
                )}
                {/* Your Picks Section */}
                {homeTeam?.id && awayTeam?.id && (
                  <div className="mt-4">
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
                  </div>
                )}
              </div>
            )}

            {/* Player Section */}
            {!isGameUpcoming && (
              <div className="w-full flex-shrink-0 py-6 overflow-y-auto min-h-screen" style={{ width: '20%' }}>
                <div className="space-y-4">
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
                            {category.leaders.map((leader, leaderIdx) => {
                              const headshot = leader.athlete.headshot;
                              const headshotUrl = typeof headshot === 'string' ? headshot : headshot?.href;
                              return (
                                <button
                                  key={`${leader.athlete.id}-${leaderIdx}`}
                                  onClick={() => navigate(`/nfl/player/${leader.athlete.id}`)}
                                  className="w-full text-left hover:bg-[#00ffe7]/5 rounded-lg p-2 transition-all group cursor-pointer"
                                >
                                  <div className="flex items-center gap-3">
                                    {headshotUrl ? (
                                      <img
                                        src={headshotUrl}
                                        alt={leader.athlete.displayName}
                                        className="w-10 h-10 rounded-full group-hover:scale-110 transition-transform object-cover"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-[#23263a] flex items-center justify-center group-hover:scale-110 transition-transform border-2 border-[#00ffe7]/30">
                                        <FaFootballBall className="text-[#00ffe7] text-sm" />
                                      </div>
                                    )}
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
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#b0b7bf] text-center py-8">No player leaders available at this time.</p>
                  )}
                </div>
              </div>
            )}

            {/* Odds Section */}
            <div className="w-full flex-shrink-0 py-6 overflow-y-auto min-h-screen" style={{ width: isGameUpcoming ? '33.333%' : '20%' }}>
              <h3 className="text-[#00ffe7] font-bold text-2xl mb-6 flex items-center gap-2">
                <FaChartBar />
                Betting Odds
              </h3>
              {homeTeam && awayTeam && (
                <ProbChart
                  gameId={event.id}
                  competitionId={competition.id}
                  gameStatus={competition.status.type.state}
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

            {/* Head to Head Section */}
            <div className="w-full flex-shrink-0 py-6 overflow-y-auto min-h-screen" style={{ width: isGameUpcoming ? '33.333%' : '20%' }}>
              {homeTeam && awayTeam && (
                <HeadToHead
                  homeTeamId={homeTeam.id}
                  awayTeamId={awayTeam.id}
                  homeTeamName={homeTeam.team.displayName}
                  awayTeamName={awayTeam.team.displayName}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreboardView;
