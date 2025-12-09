import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaFootballBall, FaArrowLeft, FaCalendar, FaChartLine, FaTrophy, FaNewspaper, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';
import type { AthleteOverview, AthleteBio } from '@/types/espn/athlete';
import LoadingFootball from '../../components/common/LoadingFootball';

interface NFLPlayerProps {
  activeTab?: 'info' | 'schedule' | 'news';
  onTabChange?: (tab: 'info' | 'schedule' | 'news') => void;
  onRegisterTabClick?: (callback: (tab: string) => void) => void;
}

const NFLPlayer: React.FC<NFLPlayerProps> = ({ activeTab = 'info', onTabChange, onRegisterTabClick }) => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  
  const [overview, setOverview] = useState<AthleteOverview | null>(null);
  const [bio, setBio] = useState<AthleteBio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Flag to prevent observer from triggering during programmatic scroll
  const isScrollingProgrammatically = useRef(false);
  
  // Refs for each section
  const infoRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const newsRef = useRef<HTMLDivElement>(null);
  
  // Map of section IDs to refs
  const sectionRefs = {
    info: infoRef,
    schedule: scheduleRef,
    news: newsRef,
  };
  
  // Register the callback with parent on mount
  useEffect(() => {
    if (onRegisterTabClick) {
      onRegisterTabClick((tab: string) => {
        isScrollingProgrammatically.current = true;
      });
    }
  }, [onRegisterTabClick]);
  
  // Scroll to section when tab changes (user clicks nav button)
  useEffect(() => {
    if (!isScrollingProgrammatically.current || !onTabChange) return;
    
    const ref = sectionRefs[activeTab];
    if (ref.current) {
      const navbarHeight = 80;
      const elementPosition = ref.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 1000);
    }
  }, [activeTab]);
  
  // Scroll tracking to highlight active section
  useEffect(() => {
    if (!onTabChange) return;
    
    let timeoutId: NodeJS.Timeout;
    
    const handleScroll = () => {
      if (isScrollingProgrammatically.current) return;
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const sectionsToCheck = ['info', 'schedule', 'news'];
        const navbarHeight = 80;
        const scrollPosition = window.scrollY + navbarHeight + 100;
        
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrolledToBottom = windowHeight + window.scrollY >= documentHeight - 200;
        
        if (scrolledToBottom) {
          onTabChange('news');
          return;
        }
        
        for (let i = sectionsToCheck.length - 1; i >= 0; i--) {
          const sectionId = sectionsToCheck[i];
          const ref = sectionRefs[sectionId as keyof typeof sectionRefs];
          
          if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const absoluteTop = rect.top + window.scrollY;
            
            if (scrollPosition >= absoluteTop) {
              onTabChange(sectionId as 'info' | 'schedule' | 'news');
              break;
            }
          }
        }
      }, 100);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [onTabChange]);

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!playerId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch overview and bio APIs in parallel
        const [overviewRes, bioRes] = await Promise.all([
          axios.get(`https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${playerId}/overview`),
          axios.get(`https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${playerId}`)
        ]);

        setOverview(overviewRes.data);
        
        // Process bio data
        if (bioRes.data) {
          setBio(bioRes.data);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching player data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load player data');
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [playerId]);

  if (loading) {
    return <LoadingFootball message="Loading player data..." />;
  }

  if (error || !overview) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1d2e] to-[#16182a] flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-8 text-center max-w-md">
          <p className="text-red-400 font-bold mb-2 text-lg">Error loading player data</p>
          <p className="text-[#e0e7ef] mb-4">{error || 'Player not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-[#00ffe7]/20 border border-[#00ffe7]/30 rounded-lg text-[#00ffe7] hover:bg-[#00ffe7]/30 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const athlete = bio?.athlete;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1d2e] to-[#16182a] pb-24">
      <div className="max-w-7xl mx-auto py-8 px-4">

        {/* Player Header */}
        <div className="bg-[#181a23]/90 rounded-xl border border-[#00ffe7]/30 shadow-[0_0_20px_rgba(0,255,231,0.1)] p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Player Image/Placeholder */}
            <div className="relative">
              <div className="w-48 h-48 rounded-full bg-[#23263a] border-4 border-[#00ffe7]/50 flex items-center justify-center overflow-hidden">
                <img 
                  src={`https://a.espncdn.com/i/headshots/nfl/players/full/${playerId}.png`}
                  alt="Player"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="w-full h-full flex items-center justify-center" style={{ display: 'none' }}>
                  <FaFootballBall className="text-6xl text-[#00ffe7]" />
                </div>
              </div>
            </div>

            {/* Player Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-5xl font-bold text-[#00ffe7] mb-2 drop-shadow-[0_0_8px_#00ffe7]">
                {athlete?.displayName || `Player #${playerId}`}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                <span className="text-2xl font-bold text-white">
                  {athlete?.position?.abbreviation || 'Position'}
                </span>
                {athlete?.team && (
                  <span className="px-3 py-1 bg-[#faafe8]/20 border border-[#faafe8]/40 rounded-full text-[#faafe8] text-sm">
                    {athlete.team.abbreviation}
                  </span>
                )}
                {athlete?.jersey && (
                  <span className="px-3 py-1 bg-[#00ffe7]/20 border border-[#00ffe7]/40 rounded-full text-[#00ffe7] text-sm">
                    #{athlete.jersey}
                  </span>
                )}
              </div>

              {/* Additional Player Info */}
              {athlete && (
                <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-300">
                  {athlete.displayHeight && (
                    <div>
                      <span className="text-gray-400">Height:</span> {athlete.displayHeight}
                    </div>
                  )}
                  {athlete.displayWeight && (
                    <div>
                      <span className="text-gray-400">Weight:</span> {athlete.displayWeight}
                    </div>
                  )}
                  {athlete.age && (
                    <div>
                      <span className="text-gray-400">Age:</span> {athlete.age}
                    </div>
                  )}
                  {athlete.college?.name && (
                    <div>
                      <span className="text-gray-400">College:</span> {athlete.college.name}
                    </div>
                  )}
                  {athlete.displayExperience && (
                    <div>
                      <span className="text-gray-400">Experience:</span> {athlete.displayExperience}
                    </div>
                  )}
                </div>
              )}

              {/* Fantasy Info */}
              {overview.fantasy && (
                <div className="flex flex-wrap gap-4 justify-center md:justify-start mt-4">
                  <div className="bg-[#23263a]/50 px-4 py-2 rounded-lg border border-[#00ffe7]/20">
                    <div className="text-xs text-gray-400">Draft Rank</div>
                    <div className="text-lg font-bold text-[#00ffe7]">{overview.fantasy.draftRank}</div>
                  </div>
                  <div className="bg-[#23263a]/50 px-4 py-2 rounded-lg border border-[#00ffe7]/20">
                    <div className="text-xs text-gray-400">Position Rank</div>
                    <div className="text-lg font-bold text-[#00ffe7]">{overview.fantasy.positionRank}</div>
                  </div>
                  <div className="bg-[#23263a]/50 px-4 py-2 rounded-lg border border-[#00ffe7]/20">
                    <div className="text-xs text-gray-400">% Owned</div>
                    <div className="text-lg font-bold text-[#00ffe7]">{overview.fantasy.percentOwned}%</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rotowire News */}
        {overview.rotowire && (
          <div className="bg-[#181a23]/90 rounded-xl border border-[#faafe8]/30 p-6 mb-6">
            <h2 className="text-xl font-bold text-[#faafe8] mb-3 flex items-center gap-2">
              <FaNewspaper />
              Latest Update
            </h2>
            <div className="text-sm text-gray-400 mb-2">
              {new Date(overview.rotowire.published).toLocaleDateString()}
            </div>
            <p className="text-[#e0e7ef] mb-2">{overview.rotowire.headline}</p>
            <p className="text-gray-300 text-sm">{overview.rotowire.story}</p>
          </div>
        )}

        {/* Overview/Stats Section */}
        <div id="info" ref={infoRef} className="space-y-6 scroll-mt-20">
          {overview.statistics && (
            <div className="bg-[#181a23]/90 rounded-xl border border-[#00ffe7]/30 p-2">
              <h2 className="text-2xl font-bold text-[#00ffe7] mb-6 flex items-center gap-2">
                <FaInfoCircle />
                Overview
              </h2>
              
              {/* Stats by Category */}
              {overview.statistics.categories && overview.statistics.categories.map((category, idx) => (
                <div key={idx} className="mb-6">
                  <h3 className="text-xl font-bold text-[#faafe8] mb-3">{category.displayName}</h3>
                  
                  {/* Stats by Split */}
                  {overview.statistics.splits && overview.statistics.splits.map((split, splitIdx) => (
                  <div key={splitIdx} className="mb-4">
                    <h4 className="text-base font-semibold text-[#00ffe7] mb-2 px-2">{split.displayName}</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#00ffe7]/20">
                            {overview.statistics.labels && overview.statistics.labels.map((label, i) => (
                              <th key={i} className="text-center py-2 px-0 text-gray-400 text-sm">{label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="hover:bg-[#00ffe7]/5">
                            {split.stats && split.stats.map((stat, statIdx) => (
                              <td key={statIdx} className="text-center py-3 px-1 text-white font-bold text-base">
                                {stat}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Game Log Section */}
        <div id="schedule" ref={scheduleRef} className="space-y-6 scroll-mt-20">
          <div className="bg-[#181a23]/90 rounded-xl border border-[#00ffe7]/30 p-6">
            <h2 className="text-2xl font-bold text-[#00ffe7] mb-6 flex items-center gap-2">
              <FaChartLine />
              Game Log
            </h2>

            {/* Game Log from Overview API */}
            {overview.gameLog && overview.gameLog.statistics && (
              <div>
                <h3 className="text-xl font-bold text-[#faafe8] mb-4">Recent Games</h3>
                {overview.gameLog.statistics?.map((statType, idx) => (
                  <div key={idx} className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-300 mb-3">{statType.displayName}</h4>
                    
                    {/* Each game as a separate section */}
                    {statType.events?.map((event, eventIdx) => {
                      const gameInfo = overview.gameLog.events[event.eventId];
                      return (
                        <button 
                          key={eventIdx} 
                          onClick={() => navigate(`/nfl/game/${event.eventId}`)}
                          className="w-full mb-4 hover:bg-[#00ffe7]/10 rounded-lg p-3 transition-all cursor-pointer"
                        >
                          {/* Game matchup as header */}
                          <div className="mb-3 px-2">
                            <div className="text-[#00ffe7] font-semibold text-base">
                              {gameInfo?.atVs} {gameInfo?.opponent.abbreviation}
                            </div>
                            <div className="text-sm text-gray-400">
                              {gameInfo?.score} ({gameInfo?.gameResult})
                            </div>
                          </div>
                          
                          {/* Stats table without game column */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-[#00ffe7]/20">
                                  {statType.labels?.map((label, i) => (
                                    <th key={i} className="text-center py-2 px-2 text-gray-400 text-sm">{label}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="hover:bg-[#00ffe7]/5">
                                  {event.stats?.map((stat, statIdx) => (
                                    <td key={statIdx} className="text-center py-3 px-2 text-white font-bold text-base">
                                      {stat}
                                    </td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* News Section */}
        <div id="news" ref={newsRef} className="space-y-6 scroll-mt-20">
          {overview.news && overview.news.length > 0 && (
            <div className="bg-[#181a23]/90 rounded-xl border border-[#00ffe7]/30 p-6">
              <h2 className="text-2xl font-bold text-[#00ffe7] mb-6 flex items-center gap-2">
                <FaNewspaper />
                News
              </h2>
              <div className="space-y-4">
                {overview.news.map((article, idx) => (
                  <div key={idx} className="bg-[#23263a]/50 rounded-xl border border-[#00ffe7]/20 p-6 hover:border-[#00ffe7]/40 transition-all">
                    <div className="flex flex-col md:flex-row gap-6">
                    {article.images && article.images.length > 0 && (
                      <img
                        src={article.images[0].url}
                        alt={article.headline}
                        className="w-full md:w-64 h-48 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="text-sm text-gray-400 mb-2">
                        {new Date(article.published).toLocaleDateString()} • {article.byline || 'ESPN'}
                      </div>
                      <h3 className="text-xl font-bold text-[#00ffe7] mb-3">
                        {article.headline}
                      </h3>
                      <p className="text-gray-300 mb-4">{article.description}</p>
                      <a
                        href={article.links.web.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-[#00ffe7]/20 border border-[#00ffe7]/30 rounded-lg text-[#00ffe7] hover:bg-[#00ffe7]/30 transition-colors text-sm"
                      >
                        Read Full Article →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
        </div>

        {/* Next Game */}
        {overview.nextGame && overview.nextGame.league.events && overview.nextGame.league.events.length > 0 && (
          <div className="bg-[#181a23]/90 rounded-xl border border-[#faafe8]/30 p-6">
            <h2 className="text-2xl font-bold text-[#faafe8] mb-4 flex items-center gap-2">
              <FaCalendar />
              {overview.nextGame.displayName}
            </h2>
            {overview.nextGame.league.events.map((game, idx) => (
              <button 
                key={idx} 
                onClick={() => navigate(`/nfl/game/${game.id}`)}
                className="w-full bg-[#23263a]/50 p-6 rounded-lg hover:bg-[#00ffe7]/10 transition-all cursor-pointer"
              >
                <div className="text-center mb-4">
                  <div className="text-[#00ffe7] font-bold">{game.weekText}</div>
                  <div className="text-gray-300">
                    {new Date(game.date).toLocaleDateString()} • {new Date(game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {game.broadcast && (
                    <div className="text-[#faafe8] text-sm mt-1">{game.broadcast}</div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-8">
                  {game.competitors[0] && (
                    <div className="text-center">
                      <img 
                        src={game.competitors[0].logo}
                        alt={game.competitors[0].displayName}
                        className="w-24 h-24 mx-auto mb-2"
                      />
                      <div className="font-bold text-white">{game.competitors[0].displayName}</div>
                      <div className="text-sm text-gray-400">{game.competitors[0].record}</div>
                    </div>
                  )}

                  <div className="text-4xl font-bold text-[#00ffe7]">VS</div>

                  {game.competitors[1] && (
                    <div className="text-center">
                      <img 
                        src={game.competitors[1].logo}
                        alt={game.competitors[1].displayName}
                        className="w-24 h-24 mx-auto mb-2"
                      />
                      <div className="font-bold text-white">{game.competitors[1].displayName}</div>
                      <div className="text-sm text-gray-400">{game.competitors[1].record}</div>
                    </div>
                  )}
                </div>

                {game.odds && (
                  <div className="mt-6 text-center border-t border-[#00ffe7]/20 pt-4">
                    <div className="text-sm text-gray-400 mb-2">Game Odds</div>
                    <div className="flex justify-center gap-6 text-sm">
                      <div>
                        <span className="text-gray-400">Spread: </span>
                        <span className="text-white font-bold">{game.odds.details}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">O/U: </span>
                        <span className="text-white font-bold">{game.odds.overUnder}</span>
                      </div>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default NFLPlayer;
