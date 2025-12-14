import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFootballBall, FaClock, FaPauseCircle, FaLock, FaCheckCircle, FaBolt, FaChartLine, FaUsers } from 'react-icons/fa';
import { useAuth } from '@/providers/AuthContext';
import HeadToHead from '@/components/nfl/HeadToHead';
import ProbChart from '@/components/nfl/ProbabilityChart';
import YourPicks from '@/pages/nfl/scoreboard/YourPicks';
import Info from '@/pages/nfl/scoreboard/Info';
import TopPicks from '@/pages/nfl/scoreboard/TopPicks';
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
  const { isAuthenticated, triggerLoginModal } = useAuth();
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
    const scoreboardTabs = ['info', 'pick', 'odds', 'headtohead'];
    return scoreboardTabs.indexOf(tab);
  };

  // Update carousel position when tab changes
  useEffect(() => {
    if (carouselRef.current) {
      const index = getTabIndex(activeTab);
      if (index !== -1) {
        const totalSlides = 4;
        const slidePercentage = 100 / totalSlides;
        carouselRef.current.style.transform = `translateX(-${index * slidePercentage}%)`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [activeTab]);

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
    <div className="">
      <div className="max-w-7xl mx-auto">
        {/* Carousel Container */}
        <div className="overflow-hidden relative">
          <div
            ref={carouselRef}
            className="flex transition-transform duration-500 ease-in-out"
            style={{ width: '400%' }}
          >
            {/* Info Section - Game Overview */}
            <div className="w-full flex-shrink-0 h-[calc(100dvh-72px)] space-y-6 py-4 pb-16 overflow-y-auto" style={{ width: '25%' }}>
              <Info
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                competition={competition}
                getTeamLogo={getTeamLogo}
                gameCountdown={gameCountdown}
                playLog={playLog}
              />
            </div>

            {/* Pick Section - Top Picks & Your Picks */}
            <div className="w-full flex-shrink-0 h-[calc(100dvh-72px)] space-y-6 py-4 pb-16 overflow-y-auto" style={{ width: '25%' }}>
              {!isAuthenticated ? (
                // Login Prompt - Advertisement Style
                <div className="flex items-center justify-center px-6">
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
                // Authenticated - Show Top Picks & Your Picks
                <>
                  {/* Top Picks - All Players Who Scored */}
                  {homeTeam?.id && awayTeam?.id && (
                  <div className="">
                    <TopPicks
                    gameId={event.id}
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
                  <div className="mt-4 ">
                  {homeTeam?.id && awayTeam?.id && (
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
                  )}
                  </div>
                </>
                )}
            </div>

            {/* Odds Section */}
            <div className="w-full flex-shrink-0 h-[calc(100dvh-72px)] space-y-6 py-4 overflow-y-auto" style={{ width: '25%' }}>
              {/* Divider */}
              <div className="border-t-2 border-[#00ffe7]/20 pt-2 mb-4"></div>
              <div className="mx-2">
                <div className="flex items-center mb-6 pb-3 border-b border-[#00ffe7]/10">
                  <h1>Odds</h1>
                </div>
              </div>
              <div className="mx-2">
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
            </div>

            {/* Head to Head Section */}
            <div className="w-full flex-shrink-0 h-[calc(100dvh-72px)] space-y-6 py-4 pb-16 overflow-y-auto" style={{ width: '25%' }}>
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
