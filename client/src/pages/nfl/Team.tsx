import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaFootballBall, FaHome, FaRoad, FaTrophy, FaUsers, FaChartLine, FaCalendar, FaMapMarkerAlt, FaStar, FaClipboardList, FaNewspaper } from "react-icons/fa";
import axios from "axios";
import type { TeamApiResponse, TeamRecord, NextEvent, Competitor } from "@/types/espn/team";
import type { LeaderCategory } from "@/types/espn/scoreboard";
import type { NewsResponse, NewsArticle } from '@/types/espn/news';
import { debugLog } from '@/utils/debugLog';
import NewsTicker from '@/components/espn/NewsTicker';
import { useLeague } from '@/providers/LeagueContext';
import { getTeamApiUrl, getTeamScheduleUrl, getNewsUrl } from '@/utils/espnApi';

interface ScheduleEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  week: {
    number: number;
    text: string;
  };
  competitions: Array<{
    id: string;
    competitors: Array<{
      id: string;
      homeAway: string;
      winner?: boolean;
      team: {
        id: string;
        abbreviation: string;
        displayName: string;
        logos: Array<{ href: string }>;
      };
      score?: {
        value: number;
        displayValue: string;
      };
    }>;
    status: {
      type: {
        id: string;
        name: string;
        state: string;
        completed: boolean;
        description: string;
        shortDetail: string;
      };
    };
    venue?: {
      fullName: string;
    };
  }>;
}

interface ScheduleData {
  events: ScheduleEvent[];
}

interface NFLTeamProps {
  activeTab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'schedule' | 'news' | 'plays' | 'dashboard' | 'games';
  onTabChange: (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'schedule' | 'news' | 'plays' | 'dashboard' | 'games') => void;
  onRegisterTabClick: (callback: (tab: string) => void) => void;
}

const NFLTeam: React.FC<NFLTeamProps> = ({ activeTab, onTabChange, onRegisterTabClick }) => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { league } = useLeague();
  const [teamData, setTeamData] = useState<TeamApiResponse | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLeague, setCurrentLeague] = useState<string>(league);

  // Refs for scroll sections
  const infoRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const newsRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);

  // Get leaders from navigation state
  const passedLeaders = (location.state as any)?.leaders as LeaderCategory[] | undefined;

  // Reset state when league changes to prevent using old team IDs with new league
  useEffect(() => {
    if (currentLeague !== league) {
      debugLog(`League changed from ${currentLeague} to ${league}, clearing team state`);
      setTeamData(null);
      setScheduleData(null);
      setNews([]);
      setError(null);
      setCurrentLeague(league);
    }
  }, [league, currentLeague]);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!teamId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch team data
        const teamResponse = await axios.get(getTeamApiUrl(league, teamId));
        setTeamData(teamResponse.data);

        // Fetch schedule
        try {
          const scheduleResponse = await axios.get(getTeamScheduleUrl(league, teamId));
          setScheduleData(scheduleResponse.data);
        } catch (schedErr) {
          debugLog('Schedule not available:', schedErr);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId, league]);

  // Fetch news on component mount
  useEffect(() => {
    const fetchNews = async () => {
      if (teamId) {
        try {
          setLoadingNews(true);
          const response = await axios.get<NewsResponse>(
            getNewsUrl(league, { team: teamId })
          );
          setNews(response.data.articles || []);
        } catch (err) {
          console.error('Error fetching news:', err);
        } finally {
          setLoadingNews(false);
        }
      }
    };

    fetchNews();
  }, [teamId, league]);

  // Register tab click callback
  useEffect(() => {
    onRegisterTabClick((tab: string) => {
      isProgrammaticScrollRef.current = true;
    });
  }, [onRegisterTabClick]);

  // Handle scrolling to sections when activeTab changes
  useEffect(() => {
    const sectionRefs: Record<string, React.RefObject<HTMLDivElement>> = {
      info: infoRef,
      schedule: scheduleRef,
      news: newsRef
    };

    const ref = sectionRefs[activeTab];
    if (ref?.current && isProgrammaticScrollRef.current) {
      const navbarHeight = 80;
      const elementPosition = ref.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 1000);
    }
  }, [activeTab]);

  // Track scroll position to update active tab
  useEffect(() => {
    const handleScroll = () => {
      // Don't update activeTab if we're programmatically scrolling
      if (isProgrammaticScrollRef.current) return;

      const sections = [
        { id: 'info' as const, ref: infoRef },
        { id: 'schedule' as const, ref: scheduleRef },
        { id: 'news' as const, ref: newsRef }
      ];

      const scrollPosition = window.scrollY + 150;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.ref.current) {
          const offsetTop = section.ref.current.offsetTop;
          if (scrollPosition >= offsetTop) {
            onTabChange(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onTabChange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bg-darkest to-bg-darkest flex items-center justify-center">
        <div className="text-center">
          <FaFootballBall className="text-6xl text-neon-cyan mx-auto mb-4 animate-bounce" />
          <p className="text-text-light text-xl">Loading team details...</p>
        </div>
      </div>
    );
  }

  if (error || !teamData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bg-darkest to-bg-darkest flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-8 text-center max-w-md">
          <p className="text-red-400 font-bold mb-2 text-lg">Error loading team data</p>
          <p className="text-text-light mb-4">{error || 'Team not found'}</p>
          <button
            onClick={() => navigate('/nfl')}
            className="px-6 py-2 bg-neon-cyan/20 border border-neon-cyan/30 rounded-lg text-neon-cyan hover:bg-neon-cyan/30 transition-colors"
          >
            Back to Scoreboard
          </button>
        </div>
      </div>
    );
  }

  const { team } = teamData;
  const primaryLogo = team.logos.find((logo) => logo.rel.includes('default') || logo.rel.includes('full'));
  const totalRecord = team.record.items.find((r: TeamRecord) => r.type === 'total');
  const homeRecord = team.record.items.find((r: TeamRecord) => r.type === 'home');
  const awayRecord = team.record.items.find((r: TeamRecord) => r.type === 'road');
  
  // Get stats from total record
  const getStatValue = (statName: string) => {
    const stat = totalRecord?.stats?.find((s) => s.name === statName);
    return stat?.value;
  };

  const nextGame: NextEvent | undefined = team.nextEvent?.[0];
  const nextCompetition = nextGame?.competitions[0];
  const homeTeam = nextCompetition?.competitors.find((c: Competitor) => c.homeAway === 'home');
  const awayTeam = nextCompetition?.competitors.find((c: Competitor) => c.homeAway === 'away');
  
  // Use leaders from navigation state (passed from GameCard as competition.leaders - SEASON data)
  // No fallback needed - if no passed leaders, don't show the section
  const teamLeaders = passedLeaders || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-darkest to-bg-darkest">
      <div className="max-w-7xl mx-auto py-8 px-4">

        {/* Team Header */}
        <div className="bg-bg-dark/90 rounded-xl border border-neon-cyan/30 shadow-[0_0_20px_rgba(0,255,231,0.1)] p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Team Logo */}
            <div className="relative">
              {primaryLogo && (
                <img
                  src={primaryLogo.href}
                  alt={team.displayName}
                  className="w-48 h-48 object-contain drop-shadow-[0_0_20px_rgba(0,255,231,0.3)]"
                />
              )}
              <div 
                className="absolute inset-0 rounded-full opacity-20 blur-3xl"
                style={{ backgroundColor: `#${team.color}` }}
              />
            </div>

            {/* Team Info */}
            <div className="flex-1 text-center md:text-left">
              <h1>
                {team.displayName}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                <span className="text-2xl font-bold text-white">{totalRecord?.summary}</span>
                {team.standingSummary && (
                  <span className="px-4 py-1 bg-neon-pink/20 border border-neon-pink/30 rounded-full text-neon-pink text-sm">
                    {team.standingSummary}
                  </span>
                )}
              </div>

              {/* Record Breakdown */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {homeRecord && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-bg-darker/50 rounded-lg border border-neon-cyan/20">
                    <FaHome className="text-neon-cyan" />
                    <div>
                      <div className="text-xs text-gray-400">Home</div>
                      <div className="text-sm font-bold text-white">{homeRecord.summary}</div>
                    </div>
                  </div>
                )}
                {awayRecord && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-bg-darker/50 rounded-lg border border-neon-cyan/20">
                    <FaRoad className="text-neon-pink" />
                    <div>
                      <div className="text-xs text-gray-400">Away</div>
                      <div className="text-sm font-bold text-white">{awayRecord.summary}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Team Info Section */}
        <div ref={infoRef} className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-bold text-neon-cyan mb-4 flex items-center gap-2">
            <FaClipboardList />
            Team Info
          </h2>
          <div className="space-y-6">
            {/* Next Game & Quick Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Next Game - Takes 2 columns */}
              {nextGame && (
                <div className="lg:col-span-2 bg-bg-dark/90 rounded-xl border border-neon-pink/30 shadow-[0_0_20px_rgba(250,175,232,0.1)] p-6">
                  <h2 className="text-2xl font-bold text-neon-pink mb-4 flex items-center gap-2">
                    <FaCalendar />
                    {nextCompetition?.status.type.completed ? 'Last Game' : 'Next Game'}
                  </h2>
                  
                  <div className="bg-bg-darker/50 rounded-lg p-6">
                    <div className="text-center mb-4">
                      <div className="text-sm text-gray-400 mb-1">
                        {new Date(nextGame.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-lg font-bold text-neon-cyan">
                        {nextGame.name}
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-8">
                      {/* Away Team */}
                      {awayTeam && (
                        <div className="flex flex-col items-center">
                          <img
                            src={awayTeam.team.logos[0]?.href}
                            alt={awayTeam.team.displayName}
                            className="w-24 h-24 object-contain mb-2"
                          />
                          <div className="text-lg font-bold text-white">{awayTeam.team.abbreviation}</div>
                          {awayTeam.score && (
                            <div className="text-3xl font-bold text-neon-cyan mt-2">
                              {awayTeam.score.displayValue}
                            </div>
                          )}
                        </div>
                      )}

                      {/* VS or @ */}
                      <div className="text-2xl font-bold text-gray-400">
                        @
                      </div>

                      {/* Home Team */}
                      {homeTeam && (
                        <div className="flex flex-col items-center">
                          <img
                            src={homeTeam.team.logos[0]?.href}
                            alt={homeTeam.team.displayName}
                            className="w-24 h-24 object-contain mb-2"
                          />
                          <div className="text-lg font-bold text-white">{homeTeam.team.abbreviation}</div>
                          {homeTeam.score && (
                            <div className="text-3xl font-bold text-neon-cyan mt-2">
                              {homeTeam.score.displayValue}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Game Status */}
                    <div className="text-center mt-4">
                      <span className="px-4 py-2 bg-neon-cyan/20 border border-neon-cyan/30 rounded-full text-neon-cyan text-sm font-bold">
                        {nextCompetition?.status.type.description || 'Scheduled'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats - 2x2 Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Points For */}
                <div className="bg-bg-dark/90 rounded-xl border border-neon-cyan/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaChartLine className="text-lg text-neon-cyan" />
                    <div className="text-xs text-gray-400">Pts For</div>
                  </div>
                  <div className="text-2xl font-bold text-neon-cyan">
                    {getStatValue('pointsFor')?.toFixed(0) || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {getStatValue('avgPointsFor')?.toFixed(1)}/game
                  </div>
                </div>

                {/* Points Against */}
                <div className="bg-bg-dark/90 rounded-xl border border-neon-pink/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaChartLine className="text-lg text-neon-pink" />
                    <div className="text-xs text-gray-400">Pts Against</div>
                  </div>
                  <div className="text-2xl font-bold text-neon-pink">
                    {getStatValue('pointsAgainst')?.toFixed(0) || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {getStatValue('avgPointsAgainst')?.toFixed(1)}/game
                  </div>
                </div>

                {/* Point Differential */}
                <div className="bg-bg-dark/90 rounded-xl border border-neon-cyan/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaTrophy className="text-lg text-neon-cyan" />
                    <div className="text-xs text-gray-400">Differential</div>
                  </div>
                  <div className={`text-2xl font-bold ${(getStatValue('pointDifferential') || 0) >= 0 ? 'text-neon-cyan' : 'text-red-400'}`}>
                    {(getStatValue('pointDifferential') || 0) >= 0 ? '+' : ''}{getStatValue('pointDifferential')?.toFixed(0) || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Total
                  </div>
                </div>

                {/* Streak */}
                <div className="bg-bg-dark/90 rounded-xl border border-neon-pink/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaFootballBall className="text-lg text-neon-pink" />
                    <div className="text-xs text-gray-400">Streak</div>
                  </div>
                  <div className={`text-2xl font-bold ${(getStatValue('streak') || 0) >= 0 ? 'text-neon-cyan' : 'text-red-400'}`}>
                    {(getStatValue('streak') || 0) >= 0 ? 'W' : 'L'}{Math.abs(getStatValue('streak') || 0)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {(getStatValue('streak') || 0) >= 0 ? 'Win' : 'Loss'}
                  </div>
                </div>
              </div>
            </div>

        {/* Division Stats */}
        <div className="bg-bg-dark/90 rounded-xl border border-neon-cyan/30 shadow-[0_0_20px_rgba(0,255,231,0.1)] p-6 mb-6">
          <h2 className="text-2xl font-bold text-neon-cyan mb-4 flex items-center gap-2">
            <FaUsers />
            Division Performance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-bg-darker/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Division Record</div>
              <div className="text-2xl font-bold text-white">
                {getStatValue('divisionWins')?.toFixed(0)}-{getStatValue('divisionLosses')?.toFixed(0)}
              </div>
            </div>
            <div className="text-center p-4 bg-bg-darker/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Division Win %</div>
              <div className="text-2xl font-bold text-neon-cyan">
                {((getStatValue('divisionWinPercent') || 0) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-4 bg-bg-darker/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Games Played</div>
              <div className="text-2xl font-bold text-white">
                {getStatValue('gamesPlayed')?.toFixed(0) || 'N/A'}
              </div>
            </div>
            <div className="text-center p-4 bg-bg-darker/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Playoff Seed</div>
              <div className="text-2xl font-bold text-neon-pink">
                #{getStatValue('playoffSeed')?.toFixed(0) || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Next Game */}
        {nextGame && (
          <div className="bg-bg-dark/90 rounded-xl border border-neon-pink/30 shadow-[0_0_20px_rgba(250,175,232,0.1)] p-6">
            <h2 className="text-2xl font-bold text-neon-pink mb-4 flex items-center gap-2">
              <FaCalendar />
              {nextCompetition?.status.type.completed ? 'Last Game' : 'Next Game'}
            </h2>
            
            <div className="bg-bg-darker/50 rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="text-sm text-gray-400 mb-1">
                  {new Date(nextGame.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-lg font-bold text-neon-cyan">
                  {nextGame.name}
                </div>
              </div>

              <div className="flex items-center justify-center gap-8">
                {/* Away Team */}
                {awayTeam && (
                  <div className="flex flex-col items-center">
                    <img
                      src={awayTeam.team.logos[0]?.href}
                      alt={awayTeam.team.displayName}
                      className="w-24 h-24 object-contain mb-2"
                    />
                    <div className="text-lg font-bold text-white">{awayTeam.team.abbreviation}</div>
                    {awayTeam.score && (
                      <div className="text-3xl font-bold text-neon-cyan mt-2">
                        {awayTeam.score.displayValue}
                      </div>
                    )}
                  </div>
                )}

                {/* VS or @ */}
                <div className="text-2xl font-bold text-gray-400">
                  @
                </div>

                {/* Home Team */}
                {homeTeam && (
                  <div className="flex flex-col items-center">
                    <img
                      src={homeTeam.team.logos[0]?.href}
                      alt={homeTeam.team.displayName}
                      className="w-24 h-24 object-contain mb-2"
                    />
                    <div className="text-lg font-bold text-white">{homeTeam.team.abbreviation}</div>
                    {homeTeam.score && (
                      <div className="text-3xl font-bold text-neon-cyan mt-2">
                        {homeTeam.score.displayValue}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Game Status */}
              <div className="text-center mt-4">
                <span className="px-4 py-2 bg-neon-cyan/20 border border-neon-cyan/30 rounded-full text-neon-cyan text-sm font-bold">
                  {nextCompetition?.status.type.description || 'Scheduled'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Team Season Leaders */}
        {teamLeaders.length > 0 && (
          <div className="bg-bg-dark/90 rounded-xl border border-neon-cyan/30 shadow-[0_0_20px_rgba(0,255,231,0.1)] p-6 mb-6">
            <h2 className="text-2xl font-bold text-neon-cyan mb-6 flex items-center gap-2">
              <FaStar />
              Season Leaders
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamLeaders.map((leader: LeaderCategory, idx: number) => {
                const topLeader = leader.leaders?.[0];
                if (!topLeader) return null;
                
                return (
                  <div 
                    key={idx} 
                    className="bg-gradient-to-br from-bg-darker/80 to-bg-dark/80 rounded-xl border border-neon-cyan/20 p-5 hover:border-neon-cyan/40 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,255,231,0.2)]"
                  >
                    {/* Category Badge */}
                    <div className="mb-4">
                      <span className="inline-block px-4 py-1.5 bg-neon-cyan/20 border border-neon-cyan/40 rounded-full text-neon-cyan text-xs font-bold uppercase tracking-wider">
                        {leader.displayName}
                      </span>
                    </div>
                    
                    {/* Player Info */}
                    <div className="flex items-center gap-3 mb-3">
                      {topLeader.athlete.headshot ? (
                        <img 
                          src={topLeader.athlete.headshot.href}
                          alt={topLeader.athlete.displayName}
                          className="w-16 h-16 rounded-full object-cover border-2 border-neon-pink/30 flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => navigate(`/nfl/player/${topLeader.athlete.id}`)}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-16 h-16 rounded-full bg-bg-darker border-2 border-neon-pink/30 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
                        style={{ display: topLeader.athlete.headshot ? 'none' : 'flex' }}
                        onClick={() => navigate(`/nfl/player/${topLeader.athlete.id}`)}
                      >
                        <FaFootballBall className="text-neon-pink text-2xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div 
                          className="text-lg font-bold text-white truncate cursor-pointer hover:text-neon-cyan transition-colors"
                          onClick={() => navigate(`/nfl/player/${topLeader.athlete.id}`)}
                        >
                          {topLeader.athlete.displayName}
                        </div>
                        <div className="text-sm text-gray-400">
                          {leader.abbreviation}
                        </div>
                      </div>
                    </div>
                    
                    {/* Stats Value */}
                    <div className="pt-3 border-t border-neon-pink/20">
                      <div className="text-3xl font-bold text-neon-pink text-center">
                        {topLeader.displayValue}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stadium Information */}
        {team.franchise?.venue && (
          <div className="bg-bg-dark/90 rounded-xl border border-neon-cyan/30 shadow-[0_0_20px_rgba(0,255,231,0.1)] p-6 mb-6">
            <h2 className="text-2xl font-bold text-neon-cyan mb-4 flex items-center gap-2">
              <FaMapMarkerAlt />
              Stadium Information
            </h2>
            <div className="bg-bg-darker/50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Venue</div>
                  <div className="text-xl font-bold text-white">{team.franchise.venue.fullName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Location</div>
                  <div className="text-xl font-bold text-white">
                    {team.franchise.venue.address.city}, {team.franchise.venue.address.state}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Surface</div>
                  <div className="text-lg font-bold text-neon-cyan">
                    {team.franchise.venue.grass ? 'Natural Grass' : 'Artificial Turf'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Type</div>
                  <div className="text-lg font-bold text-neon-cyan">
                    {team.franchise.venue.indoor ? 'Indoor Stadium' : 'Outdoor Stadium'}
                  </div>
                </div>
              </div>
              
              {/* Stadium Images */}
              {team.franchise.venue.images && team.franchise.venue.images.length > 0 && (
                <div className="mt-6">
                  <img
                    src={team.franchise.venue.images[0].href}
                    alt={team.franchise.venue.fullName}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        )}
        </div>
        </div>

        {/* Schedule Section */}
        <div ref={scheduleRef} className="mb-8 scroll-mt-20">
        {scheduleData && scheduleData.events && scheduleData.events.length > 0 && (
          <div className="bg-bg-dark/90 rounded-xl border border-neon-cyan/30 shadow-[0_0_20px_rgba(0,255,231,0.1)] p-6 mb-6">
            <h2 className="text-2xl font-bold text-neon-cyan mb-6 flex items-center gap-2">
              <FaCalendar />
              2025 Season Schedule
            </h2>
            
            <div className="space-y-3">
              {scheduleData.events.map((event) => {
                const competition = event.competitions[0];
                const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
                const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
                const isCompleted = competition.status.type.completed;
                const teamCompetitor = competition.competitors.find(c => c.team.id === teamId);
                const opponentCompetitor = competition.competitors.find(c => c.team.id !== teamId);
                const isHome = teamCompetitor?.homeAway === 'home';
                const didWin = teamCompetitor?.winner;
                
                return (
                  <div
                    key={event.id}
                    className={`bg-gradient-to-r rounded-xl border-2 p-4 transition-all hover:scale-[1.02] cursor-pointer ${
                      isCompleted
                        ? didWin
                          ? 'from-neon-cyan/10 to-neon-cyan/5 border-neon-cyan/40 hover:border-neon-cyan/60 hover:shadow-[0_0_20px_rgba(0,255,231,0.2)]'
                          : 'from-red-500/10 to-red-500/5 border-red-500/40 hover:border-red-500/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                        : 'from-bg-darker/80 to-bg-dark/60 border-neon-pink/30 hover:border-neon-pink/50 hover:shadow-[0_0_20px_rgba(250,175,232,0.2)]'
                    }`}
                    onClick={() => navigate(`/nfl/game/${event.id}`)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Week & Date Info - Left */}
                      <div className="flex-shrink-0 min-w-[70px]">
                        <div className="text-xs text-gray-400 uppercase tracking-wider">{event.week.text}</div>
                        <div className="text-sm font-bold text-neon-cyan">
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>

                      {/* Teams - Stacked Vertically */}
                      <div className="flex flex-col gap-2 flex-1">
                        {/* Away Team */}
                        <div className="flex items-center gap-2">
                          <img
                            src={awayTeam?.team.logos[0]?.href}
                            alt={awayTeam?.team.displayName}
                            className="w-8 h-8 object-contain"
                          />
                          <div className="text-sm font-bold text-white">{awayTeam?.team.abbreviation}</div>
                        </div>

                        {/* Home Team */}
                        <div className="flex items-center gap-2">
                          <img
                            src={homeTeam?.team.logos[0]?.href}
                            alt={homeTeam?.team.displayName}
                            className="w-8 h-8 object-contain"
                          />
                          <div className="text-sm font-bold text-white">{homeTeam?.team.abbreviation}</div>
                        </div>
                      </div>

                      {/* Scores - Right Aligned */}
                      {isCompleted && (
                        <div className="flex flex-col gap-2 flex-shrink-0 min-w-[50px] items-end">
                          <div className={`text-xl font-bold ${awayTeam?.winner ? 'text-neon-cyan' : 'text-gray-400'}`}>
                            {awayTeam?.score?.displayValue || '0'}
                          </div>
                          <div className={`text-xl font-bold ${homeTeam?.winner ? 'text-neon-cyan' : 'text-gray-400'}`}>
                            {homeTeam?.score?.displayValue || '0'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status Footer */}
                    <div className="mt-3 pt-3 border-t border-neon-cyan/10 flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        {isCompleted ? (
                          didWin ? (
                            <span className="text-neon-cyan font-semibold">Final - Win</span>
                          ) : (
                            <span className="text-red-400 font-semibold">Final - Loss</span>
                          )
                        ) : (
                          <span>{isHome ? 'HOME' : 'AWAY'} • {new Date(event.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                        )}
                      </div>
                      {competition.venue && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <FaMapMarkerAlt className="text-neon-pink" />
                          <span className="truncate max-w-[200px]">{competition.venue.fullName}</span>
                        </div>
                      )}
                    </div>


                  </div>
                );
              })}
            </div>
          </div>
        )}
        </div>

        {/* News Section */}
        <div ref={newsRef} className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-bold text-neon-pink mb-4 flex items-center gap-2">
            <FaNewspaper />
            Team News
          </h2>

          {loadingNews ? (
              <div className="text-center py-20">
                <FaFootballBall className="text-6xl text-neon-pink mx-auto mb-4 animate-pulse" />
                <p className="text-text-light text-xl">Loading team news...</p>
              </div>
            ) : news.length > 0 ? (
              <NewsTicker news={news} />
            ) : (
              <div className="bg-bg-dark/90 rounded-xl border border-neon-pink/30 p-12 text-center">
                <FaNewspaper className="text-6xl text-neon-pink mx-auto mb-4 opacity-50" />
                <p className="text-text-light text-xl">No news available for this team</p>
              </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default NFLTeam;