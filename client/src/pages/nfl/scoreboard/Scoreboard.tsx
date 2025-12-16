import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFootballBall, FaClock, FaPauseCircle, FaLock, FaCheckCircle, FaBolt, FaChartLine, FaUsers } from 'react-icons/fa';
import { useAuth } from '@/providers/AuthContext';
import HeadToHead from '@/components/nfl/HeadToHead';
import ProbChart from '@/components/nfl/ProbabilityChart';
import PointsChart from '@/components/nfl/PointsChart';
import PlayerPick from '@/pages/nfl/scoreboard/PlayerPick';
import Info from '@/pages/nfl/scoreboard/Info';
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
    
    playLog.forEach((play) => {
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
          timestamp: play.timestamp,
          homeScore: currentHomeScore,
          awayScore: currentAwayScore
        });
      }
    });
    
    return plays;
  }, [playLog, homeTeam?.id]);

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
              
              {/* Points Chart - Show for all games with scoring data */}
              {scoringPlays.length > 0 && (
                <div className="mt-4">
                  <div className="border-t-2 border-[#00ffe7]/20 pt-2 mb-4"></div>
                  <div className="mx-2">
                    <PointsChart
                      gameId={event.id}
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

            {/* Pick Section - Top Picks & Your Picks */}
            <div className="w-full flex-shrink-0 h-[calc(100dvh-72px)] space-y-6 py-4 pb-16 overflow-y-auto" style={{ width: '25%' }}>
              {homeTeam?.id && awayTeam?.id && (
                <PlayerPick
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
