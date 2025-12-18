import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaFootballBall, FaArrowLeft, FaHome, FaRoad, FaTrophy, FaUsers, FaChartLine, FaCalendar, FaMapMarkerAlt, FaStar, FaCrosshairs, FaListOl, FaClipboardList, FaNewspaper } from "react-icons/fa";
import axios from "axios";
import type { TeamApiResponse, TeamRecord, NextEvent, Competitor, Leader } from "@/types/espn/team";
import type { NewsResponse, NewsArticle } from '@/types/espn/news';
import NewsTicker from '@/components/nfl/NewsTicker';

interface ProjectionData {
  chanceToWinThisWeek: number;
  chanceToWinDivision: number;
  projectedWins: number;
  projectedLosses: number;
}

interface RecordStat {
  name: string;
  displayName: string;
  value: number;
  displayValue: string;
}

interface RecordItem {
  id: string;
  name: string;
  displayName?: string;
  type: string;
  summary: string;
  displayValue: string;
  value: number;
  stats: RecordStat[];
}

interface DetailedRecordData {
  items: RecordItem[];
}

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
  const [teamData, setTeamData] = useState<TeamApiResponse | null>(null);
  const [projectionData, setProjectionData] = useState<ProjectionData | null>(null);
  const [detailedRecords, setDetailedRecords] = useState<DetailedRecordData | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs for scroll sections
  const infoRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const newsRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);

  // Get leaders from navigation state
  const passedLeaders = (location.state as any)?.leaders as Leader[] | undefined;

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!teamId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch team data
        const teamResponse = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}`);
        setTeamData(teamResponse.data);

        // Fetch projection data
        try {
          const projectionResponse = await axios.get(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/${teamId}/projection`);
          setProjectionData(projectionResponse.data);
        } catch (projErr) {
          console.log('Projection data not available:', projErr);
        }

        // Fetch detailed records
        try {
          const recordsResponse = await axios.get(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/2/teams/${teamId}/record`);
          setDetailedRecords(recordsResponse.data);
        } catch (recErr) {
          console.log('Detailed records not available:', recErr);
        }

        // Fetch schedule
        try {
          const scheduleResponse = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/schedule`);
          setScheduleData(scheduleResponse.data);
        } catch (schedErr) {
          console.log('Schedule not available:', schedErr);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  // Fetch news on component mount
  useEffect(() => {
    const fetchNews = async () => {
      if (teamId) {
        try {
          setLoadingNews(true);
          const response = await axios.get<NewsResponse>(
            `https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?team=${teamId}`
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
  }, [teamId]);

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
      <div className="min-h-screen bg-gradient-to-b from-[#1a1d2e] to-[#16182a] flex items-center justify-center">
        <div className="text-center">
          <FaFootballBall className="text-6xl text-[#00ffe7] mx-auto mb-4 animate-bounce" />
          <p className="text-[#e0e7ef] text-xl">Loading team details...</p>
        </div>
      </div>
    );
  }

  if (error || !teamData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1d2e] to-[#16182a] flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-8 text-center max-w-md">
          <p className="text-red-400 font-bold mb-2 text-lg">Error loading team data</p>
          <p className="text-[#e0e7ef] mb-4">{error || 'Team not found'}</p>
          <button
            onClick={() => navigate('/nfl')}
            className="px-6 py-2 bg-[#00ffe7]/20 border border-[#00ffe7]/30 rounded-lg text-[#00ffe7] hover:bg-[#00ffe7]/30 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-b from-[#1a1d2e] to-[#16182a]">
      <div className="max-w-7xl mx-auto py-8 px-4">

        {/* Team Header */}
        <div className="bg-[#181a23]/90 rounded-xl border border-[#00ffe7]/30 shadow-[0_0_20px_rgba(0,255,231,0.1)] p-8 mb-6">
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
                  <span className="px-4 py-1 bg-[#faafe8]/20 border border-[#faafe8]/30 rounded-full text-[#faafe8] text-sm">
                    {team.standingSummary}
                  </span>
                )}
              </div>

              {/* Record Breakdown */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {homeRecord && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#23263a]/50 rounded-lg border border-[#00ffe7]/20">
                    <FaHome className="text-[#00ffe7]" />
                    <div>
                      <div className="text-xs text-gray-400">Home</div>
                      <div className="text-sm font-bold text-white">{homeRecord.summary}</div>
                    </div>
                  </div>
                )}
                {awayRecord && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#23263a]/50 rounded-lg border border-[#00ffe7]/20">
                    <FaRoad className="text-[#faafe8]" />
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
          <h2 className="text-2xl font-bold text-[#00ffe7] mb-4 flex items-center gap-2">
            <FaClipboardList />
            Team Info
          </h2>
          <div className="space-y-6">
            {/* Next Game & Quick Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Next Game - Takes 2 columns */}
              {nextGame && (
                <div className="lg:col-span-2 bg-[#181a23]/90 rounded-xl border border-[#faafe8]/30 shadow-[0_0_20px_rgba(250,175,232,0.1)] p-6">
                  <h2 className="text-2xl font-bold text-[#faafe8] mb-4 flex items-center gap-2">
                    <FaCalendar />
                    {nextCompetition?.status.type.completed ? 'Last Game' : 'Next Game'}
                  </h2>
                  
                  <div className="bg-[#23263a]/50 rounded-lg p-6">
                    <div className="text-center mb-4">
                      <div className="text-sm text-gray-400 mb-1">
                        {new Date(nextGame.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-lg font-bold text-[#00ffe7]">
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
                            <div className="text-3xl font-bold text-[#00ffe7] mt-2">
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
                            <div className="text-3xl font-bold text-[#00ffe7] mt-2">
                              {homeTeam.score.displayValue}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Game Status */}
                    <div className="text-center mt-4">
                      <span className="px-4 py-2 bg-[#00ffe7]/20 border border-[#00ffe7]/30 rounded-full text-[#00ffe7] text-sm font-bold">
                        {nextCompetition?.status.type.description || 'Scheduled'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats - 2x2 Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Points For */}
                <div className="bg-[#181a23]/90 rounded-xl border border-[#00ffe7]/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaChartLine className="text-lg text-[#00ffe7]" />
                    <div className="text-xs text-gray-400">Pts For</div>
                  </div>
                  <div className="text-2xl font-bold text-[#00ffe7]">
                    {getStatValue('pointsFor')?.toFixed(0) || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {getStatValue('avgPointsFor')?.toFixed(1)}/game
                  </div>
                </div>

                {/* Points Against */}
                <div className="bg-[#181a23]/90 rounded-xl border border-[#faafe8]/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaChartLine className="text-lg text-[#faafe8]" />
                    <div className="text-xs text-gray-400">Pts Against</div>
                  </div>
                  <div className="text-2xl font-bold text-[#faafe8]">
                    {getStatValue('pointsAgainst')?.toFixed(0) || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {getStatValue('avgPointsAgainst')?.toFixed(1)}/game
                  </div>
                </div>

                {/* Point Differential */}
                <div className="bg-[#181a23]/90 rounded-xl border border-[#00ffe7]/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaTrophy className="text-lg text-[#00ffe7]" />
                    <div className="text-xs text-gray-400">Differential</div>
                  </div>
                  <div className={`text-2xl font-bold ${(getStatValue('pointDifferential') || 0) >= 0 ? 'text-[#00ffe7]' : 'text-red-400'}`}>
                    {(getStatValue('pointDifferential') || 0) >= 0 ? '+' : ''}{getStatValue('pointDifferential')?.toFixed(0) || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Total
                  </div>
                </div>

                {/* Streak */}
                <div className="bg-[#181a23]/90 rounded-xl border border-[#faafe8]/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaFootballBall className="text-lg text-[#faafe8]" />
                    <div className="text-xs text-gray-400">Streak</div>
                  </div>
                  <div className={`text-2xl font-bold ${(getStatValue('streak') || 0) >= 0 ? 'text-[#00ffe7]' : 'text-red-400'}`}>
                    {(getStatValue('streak') || 0) >= 0 ? 'W' : 'L'}{Math.abs(getStatValue('streak') || 0)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {(getStatValue('streak') || 0) >= 0 ? 'Win' : 'Loss'}
                  </div>
                </div>
              </div>
            </div>

            {/* Season Projections - Compact Grid */}
            {projectionData && (
              <div className="bg-gradient-to-br from-[#181a23]/90 to-[#23263a]/90 rounded-xl border border-[#faafe8]/30 shadow-[0_0_20px_rgba(250,175,232,0.1)] p-6 mb-6">
                <h2 className="text-xl font-bold text-[#faafe8] mb-4 flex items-center gap-2">
                  <FaCrosshairs />
                  2025 Projections
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {/* Projected Record */}
                  <div className="bg-[#23263a]/50 rounded-lg p-4 border border-[#00ffe7]/30">
                    <div className="text-xs text-gray-400 mb-2">Projected Record</div>
                    <div className="text-3xl font-bold text-[#00ffe7] mb-1">
                      {projectionData.projectedWins.toFixed(1)}-{projectionData.projectedLosses.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {((projectionData.projectedWins / (projectionData.projectedWins + projectionData.projectedLosses)) * 100).toFixed(0)}% Win Rate
                    </div>
                  </div>

                  {/* Division Odds */}
                  <div className="bg-[#23263a]/50 rounded-lg p-4 border border-[#faafe8]/30">
                    <div className="text-xs text-gray-400 mb-2">Division Odds</div>
                    <div className="text-3xl font-bold text-[#faafe8] mb-1">
                      {(projectionData.chanceToWinDivision * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">
                      {projectionData.chanceToWinDivision >= 0.5 ? 'Favorite' : projectionData.chanceToWinDivision >= 0.25 ? 'Contender' : 'Underdog'}
                    </div>
                  </div>

                  {/* This Week */}
                  <div className="bg-[#23263a]/50 rounded-lg p-4 border border-[#00ffe7]/30">
                    <div className="text-xs text-gray-400 mb-2">This Week</div>
                    <div className="text-3xl font-bold text-[#00ffe7] mb-1">
                      {(projectionData.chanceToWinThisWeek * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">Win Probability</div>
                  </div>

                  {/* Playoff Outlook */}
                  <div className={`rounded-lg p-4 border-2 ${
                    projectionData.projectedWins >= 10 
                      ? 'bg-[#00ffe7]/10 border-[#00ffe7]/50' 
                      : projectionData.projectedWins >= 9 
                      ? 'bg-yellow-500/10 border-yellow-500/50'
                      : 'bg-red-500/10 border-red-500/50'
                  }`}>
                    <div className="text-xs text-gray-400 mb-2">Playoff Outlook</div>
                    <div className={`text-3xl font-bold mb-1 ${
                      projectionData.projectedWins >= 10 ? 'text-[#00ffe7]' : 
                      projectionData.projectedWins >= 9 ? 'text-yellow-400' : 
                      'text-red-400'
                    }`}>
                      {projectionData.projectedWins >= 10 ? 'STRONG' : projectionData.projectedWins >= 9 ? 'LIKELY' : 'BUBBLE'}
                    </div>
                    <div className="text-xs text-gray-400">
                      Based on {projectionData.projectedWins.toFixed(1)} wins
                    </div>
                  </div>
                </div>
              </div>
            )}

        {/* Detailed Records Breakdown */}
        {detailedRecords && (
          <div className="bg-[#181a23]/90 rounded-xl border border-[#00ffe7]/30 shadow-[0_0_20px_rgba(0,255,231,0.1)] p-6 mb-6">
            <h2 className="text-xl font-bold text-[#00ffe7] mb-4 flex items-center gap-2">
              <FaListOl />
              Detailed Records
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {detailedRecords.items.map((record, idx) => {
                const getRecordStat = (statName: string) => {
                  const stat = record.stats.find(s => s.name === statName);
                  return stat?.displayValue || stat?.value?.toString() || 'N/A';
                };

                return (
                  <div 
                    key={idx}
                    className="bg-[#23263a]/50 rounded-lg border border-[#00ffe7]/20 p-3 hover:border-[#00ffe7]/40 transition-all"
                  >
                    <div className="text-xs text-gray-400 mb-1 uppercase">{record.displayName || record.name}</div>
                    <div className="text-2xl font-bold text-white mb-1">{record.summary}</div>
                    <div className="text-xs text-gray-400">{(record.value * 100).toFixed(0)}% Win Rate</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Division Stats */}
        <div className="bg-[#181a23]/90 rounded-xl border border-[#00ffe7]/30 shadow-[0_0_20px_rgba(0,255,231,0.1)] p-6 mb-6">
          <h2 className="text-2xl font-bold text-[#00ffe7] mb-4 flex items-center gap-2">
            <FaUsers />
            Division Performance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-[#23263a]/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Division Record</div>
              <div className="text-2xl font-bold text-white">
                {getStatValue('divisionWins')?.toFixed(0)}-{getStatValue('divisionLosses')?.toFixed(0)}
              </div>
            </div>
            <div className="text-center p-4 bg-[#23263a]/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Division Win %</div>
              <div className="text-2xl font-bold text-[#00ffe7]">
                {((getStatValue('divisionWinPercent') || 0) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-4 bg-[#23263a]/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Games Played</div>
              <div className="text-2xl font-bold text-white">
                {getStatValue('gamesPlayed')?.toFixed(0) || 'N/A'}
              </div>
            </div>
            <div className="text-center p-4 bg-[#23263a]/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Playoff Seed</div>
              <div className="text-2xl font-bold text-[#faafe8]">
                #{getStatValue('playoffSeed')?.toFixed(0) || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Next Game */}
        {nextGame && (
          <div className="bg-[#181a23]/90 rounded-xl border border-[#faafe8]/30 shadow-[0_0_20px_rgba(250,175,232,0.1)] p-6">
            <h2 className="text-2xl font-bold text-[#faafe8] mb-4 flex items-center gap-2">
              <FaCalendar />
              {nextCompetition?.status.type.completed ? 'Last Game' : 'Next Game'}
            </h2>
            
            <div className="bg-[#23263a]/50 rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="text-sm text-gray-400 mb-1">
                  {new Date(nextGame.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-lg font-bold text-[#00ffe7]">
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
                      <div className="text-3xl font-bold text-[#00ffe7] mt-2">
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
                      <div className="text-3xl font-bold text-[#00ffe7] mt-2">
                        {homeTeam.score.displayValue}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Game Status */}
              <div className="text-center mt-4">
                <span className="px-4 py-2 bg-[#00ffe7]/20 border border-[#00ffe7]/30 rounded-full text-[#00ffe7] text-sm font-bold">
                  {nextCompetition?.status.type.description || 'Scheduled'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Team Season Leaders */}
        {teamLeaders.length > 0 && (
          <div className="bg-[#181a23]/90 rounded-xl border border-[#00ffe7]/30 shadow-[0_0_20px_rgba(0,255,231,0.1)] p-6 mb-6">
            <h2 className="text-2xl font-bold text-[#00ffe7] mb-6 flex items-center gap-2">
              <FaStar />
              Season Leaders
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamLeaders.map((leader: Leader, idx: number) => {
                const topLeader = leader.leaders?.[0];
                if (!topLeader) return null;
                
                return (
                  <div 
                    key={idx} 
                    className="bg-gradient-to-br from-[#23263a]/80 to-[#181a23]/80 rounded-xl border border-[#00ffe7]/20 p-5 hover:border-[#00ffe7]/40 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,255,231,0.2)]"
                  >
                    {/* Category Badge */}
                    <div className="mb-4">
                      <span className="inline-block px-4 py-1.5 bg-[#00ffe7]/20 border border-[#00ffe7]/40 rounded-full text-[#00ffe7] text-xs font-bold uppercase tracking-wider">
                        {leader.displayName}
                      </span>
                    </div>
                    
                    {/* Player Info */}
                    <div className="flex items-center gap-3 mb-3">
                      {topLeader.athlete.headshot ? (
                        <img 
                          src={topLeader.athlete.headshot.href}
                          alt={topLeader.athlete.displayName}
                          className="w-16 h-16 rounded-full object-cover border-2 border-[#faafe8]/30 flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => navigate(`/nfl/player/${topLeader.athlete.id}`)}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-16 h-16 rounded-full bg-[#23263a] border-2 border-[#faafe8]/30 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
                        style={{ display: topLeader.athlete.headshot ? 'none' : 'flex' }}
                        onClick={() => navigate(`/nfl/player/${topLeader.athlete.id}`)}
                      >
                        <FaFootballBall className="text-[#faafe8] text-2xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div 
                          className="text-lg font-bold text-white truncate cursor-pointer hover:text-[#00ffe7] transition-colors"
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
                    <div className="pt-3 border-t border-[#faafe8]/20">
                      <div className="text-3xl font-bold text-[#faafe8] text-center">
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
          <div className="bg-[#181a23]/90 rounded-xl border border-[#00ffe7]/30 shadow-[0_0_20px_rgba(0,255,231,0.1)] p-6 mb-6">
            <h2 className="text-2xl font-bold text-[#00ffe7] mb-4 flex items-center gap-2">
              <FaMapMarkerAlt />
              Stadium Information
            </h2>
            <div className="bg-[#23263a]/50 rounded-lg p-6">
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
                  <div className="text-lg font-bold text-[#00ffe7]">
                    {team.franchise.venue.grass ? 'Natural Grass' : 'Artificial Turf'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Type</div>
                  <div className="text-lg font-bold text-[#00ffe7]">
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
          <div className="bg-[#181a23]/90 rounded-xl border border-[#00ffe7]/30 shadow-[0_0_20px_rgba(0,255,231,0.1)] p-6 mb-6">
            <h2 className="text-2xl font-bold text-[#00ffe7] mb-6 flex items-center gap-2">
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
                          ? 'from-[#00ffe7]/10 to-[#00ffe7]/5 border-[#00ffe7]/40 hover:border-[#00ffe7]/60 hover:shadow-[0_0_20px_rgba(0,255,231,0.2)]'
                          : 'from-red-500/10 to-red-500/5 border-red-500/40 hover:border-red-500/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                        : 'from-[#23263a]/80 to-[#181a23]/60 border-[#faafe8]/30 hover:border-[#faafe8]/50 hover:shadow-[0_0_20px_rgba(250,175,232,0.2)]'
                    }`}
                    onClick={() => navigate(`/nfl/game/${event.id}`)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Week & Date Info - Left */}
                      <div className="flex-shrink-0 min-w-[70px]">
                        <div className="text-xs text-gray-400 uppercase tracking-wider">{event.week.text}</div>
                        <div className="text-sm font-bold text-[#00ffe7]">
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
                          <div className={`text-xl font-bold ${awayTeam?.winner ? 'text-[#00ffe7]' : 'text-gray-400'}`}>
                            {awayTeam?.score?.displayValue || '0'}
                          </div>
                          <div className={`text-xl font-bold ${homeTeam?.winner ? 'text-[#00ffe7]' : 'text-gray-400'}`}>
                            {homeTeam?.score?.displayValue || '0'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status Footer */}
                    <div className="mt-3 pt-3 border-t border-[#00ffe7]/10 flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        {isCompleted ? (
                          didWin ? (
                            <span className="text-[#00ffe7] font-semibold">Final - Win</span>
                          ) : (
                            <span className="text-red-400 font-semibold">Final - Loss</span>
                          )
                        ) : (
                          <span>{isHome ? 'HOME' : 'AWAY'} • {new Date(event.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                        )}
                      </div>
                      {competition.venue && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <FaMapMarkerAlt className="text-[#faafe8]" />
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
          <h2 className="text-2xl font-bold text-[#faafe8] mb-4 flex items-center gap-2">
            <FaNewspaper />
            Team News
          </h2>

          {loadingNews ? (
              <div className="text-center py-20">
                <FaFootballBall className="text-6xl text-[#faafe8] mx-auto mb-4 animate-pulse" />
                <p className="text-[#e0e7ef] text-xl">Loading team news...</p>
              </div>
            ) : news.length > 0 ? (
              <NewsTicker news={news} />
            ) : (
              <div className="bg-[#181a23]/90 rounded-xl border border-[#faafe8]/30 p-12 text-center">
                <FaNewspaper className="text-6xl text-[#faafe8] mx-auto mb-4 opacity-50" />
                <p className="text-[#e0e7ef] text-xl">No news available for this team</p>
              </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default NFLTeam;