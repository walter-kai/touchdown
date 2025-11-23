import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaFootballBall, FaTrophy, FaChartBar, FaMedkit } from 'react-icons/fa';
import axios from 'axios';
import HeadToHead from '@/components/nfl/HeadToHead';
import Prediction from '@/components/nfl/Prediction';
import Odds from '@/components/nfl/Odds';

import type { Event, ScoreboardResponse } from '@/types/espn/scoreboard';
import type { Summary } from '@/types/espn/summary';

interface NFLGameProps {
  activeTab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'odds';
  onTabChange: (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'odds') => void;
  onPresetChange: (preset: 'scoreboard' | 'summary') => void;
  onRegisterTabClick?: (callback: (tab: string) => void) => void;
}

const NFLGame: React.FC<NFLGameProps> = ({ activeTab, onTabChange, onPresetChange, onRegisterTabClick }) => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navPreset, setNavPreset] = useState<'scoreboard' | 'summary'>('scoreboard');
  
  // Flag to prevent observer from triggering during programmatic scroll
  const isScrollingProgrammatically = useRef(false);
  
  // Register the callback with parent on mount
  useEffect(() => {
    if (onRegisterTabClick) {
      onRegisterTabClick((tab: string) => {
        isScrollingProgrammatically.current = true;
      });
    }
  }, [onRegisterTabClick]);
  
  // Handler for when user clicks a nav button
  const handleTabClick = useCallback((tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'odds') => {
    isScrollingProgrammatically.current = true;
    onTabChange(tab);
  }, [onTabChange]);
  
  // Refs for each section
  const infoRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const headtoheadRef = useRef<HTMLDivElement>(null);
  const predictionRef = useRef<HTMLDivElement>(null);
  const oddsRef = useRef<HTMLDivElement>(null);
  
  // Map of section IDs to refs
  const sectionRefs = {
    info: infoRef,
    team: teamRef,
    player: playerRef,
    headtohead: headtoheadRef,
    prediction: predictionRef,
    odds: oddsRef,
  };
  
  // Scroll to section when tab changes (user clicks nav button)
  useEffect(() => {
    // Only scroll if the flag is set (meaning user clicked a button)
    if (!isScrollingProgrammatically.current) return;
    
    const ref = sectionRefs[activeTab];
    if (ref.current) {
      const navbarHeight = 80; // Approximate navbar height
      const elementPosition = ref.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Reset flag after scroll completes
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 1000); // Smooth scroll usually takes ~500-800ms
    }
  }, [activeTab]);
  
  // Scroll tracking to highlight active section
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleScroll = () => {
      // Don't update activeTab if we're programmatically scrolling
      if (isScrollingProgrammatically.current) return;
      
      // Debounce scroll events
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const sectionsToCheck = 
          navPreset === 'scoreboard' 
            ? ['info', 'player', 'headtohead']
            : ['info', 'team', 'prediction', 'odds'];
        
        const navbarHeight = 80;
        const scrollPosition = window.scrollY + navbarHeight + 100; // Add some offset
        
        // Check if we're near the bottom of the page - if so, activate last section
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrolledToBottom = windowHeight + window.scrollY >= documentHeight - 200; // 200px threshold
        
        if (scrolledToBottom) {
          const lastSection = sectionsToCheck[sectionsToCheck.length - 1];
          onTabChange(lastSection as 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'odds');
          return;
        }
        
        // Find which section we're currently in
        for (let i = sectionsToCheck.length - 1; i >= 0; i--) {
          const sectionId = sectionsToCheck[i];
          const ref = sectionRefs[sectionId as keyof typeof sectionRefs];
          
          if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const absoluteTop = rect.top + window.scrollY;
            
            if (scrollPosition >= absoluteTop) {
              onTabChange(sectionId as 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'odds');
              break;
            }
          }
        }
      }, 100); // Debounce by 100ms
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [navPreset, onTabChange]);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) return;

      try {
        setLoading(true);
        setError(null);

        let game: Event | undefined;
        let gameStatus: string | undefined;
        let usedSummaryApi = false;

        // Check if gameId is "test" - use local JSON file
        if (gameId === 'test') {
          const response = await axios.get<ScoreboardResponse>('/scoreboard.json');
          game = response.data.events?.[0];
          gameStatus = game?.competitions[0].status.type.state;
        } else {
          // Try to find game in current week's scoreboard first
          const scoreboardResponse = await axios.get<ScoreboardResponse>(
            `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`
          );
          game = scoreboardResponse.data.events?.find(e => e.id === gameId);
          gameStatus = game?.competitions[0].status.type.state;
        }
        
        // Fetch summary API if:
        // 1. Game not found in scoreboard (past/future games), OR
        // 2. Game is not live (pre/post game)
        if (!game || gameStatus !== 'in') {
          try {
            const summaryResponse = await axios.get<Summary>(
              `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`
            );
            setSummary(summaryResponse.data);
            usedSummaryApi = true;
            
            // If game wasn't found in scoreboard, extract it from summary
            if (!game && summaryResponse.data.header) {
              game = summaryResponse.data.header as unknown as Event;
            }
          } catch (summaryErr) {
            console.error('Error fetching summary data:', summaryErr);
            if (!game) {
              // If we have no game data at all, show error
              setError('Game not found');
              setLoading(false);
              return;
            }
            // Otherwise continue without summary data
          }
        }
        
        if (!game) {
          setError('Game data not available');
          setLoading(false);
          return;
        }
        
        // Set nav preset based on which API provided the data
        const preset = usedSummaryApi ? 'summary' : 'scoreboard';
        setNavPreset(preset);
        onPresetChange(preset);
        setEvent(game);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching game data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load game data');
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1d2e] to-[#16182a] flex items-center justify-center">
        <div className="text-center">
          <FaFootballBall className="text-6xl text-[#00ffe7] mx-auto mb-4 animate-bounce" />
          <p className="text-[#e0e7ef] text-xl">Loading game details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1d2e] to-[#16182a] flex items-center justify-center pb-20">
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-8 text-center max-w-md">
          <p className="text-red-400 font-bold mb-2 text-lg">Error loading game</p>
          <p className="text-[#e0e7ef]">{error || 'Game not found'}</p>
        </div>
      </div>
    );
  }

  const competition = event.competitions[0];
  const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
  const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
  const isGameInSession = competition.status.type.state === 'in';
  
  // Get venue image from summary if available
  const venueImage = summary?.gameInfo?.venue?.images?.[0]?.href;

  // Helper function to get logo URL - handles both scoreboard (logo string) and summary (logos array of TeamLogo)
  const getTeamLogo = (team: any): string => {
    if (team?.logo) return team.logo; // Scoreboard API: logo is a string
    if (team?.logos?.[0]?.href) return team.logos[0].href; // Summary API: logos is TeamLogo[]
    return '';
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Box Score - Always visible at top */}
        <div className="bg-[#181a23]/90 border border-[#00ffe7]/30 rounded-xl shadow-[0_0_20px_rgba(0,255,231,0.1)] p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Away Team */}
            <button 
              onClick={() => awayTeam?.id && navigate(`/nfl/team/${awayTeam.id}`)}
              className="flex flex-col items-center hover:bg-[#00ffe7]/10 rounded-lg p-3 transition-all group cursor-pointer"
            >
              <img 
                src={getTeamLogo(awayTeam?.team)} 
                alt={awayTeam?.team?.displayName}
                className="w-16 h-16 md:w-20 md:h-20 mb-2 group-hover:scale-110 transition-transform"
              />
              <h2 className="text-[#e0e7ef] font-bold text-sm md:text-base text-center max-w-full px-2 group-hover:text-[#00ffe7] transition-colors leading-tight">
                {awayTeam?.team?.displayName}
              </h2>
              <p className="text-[#b0b7bf] text-xs">{awayTeam?.records?.[0]?.summary}</p>
              <p className="text-[#00ffe7] text-3xl md:text-4xl font-bold mt-1">{awayTeam?.score || '0'}</p>
            </button>

            {/* VS / Status */}
            <div className="text-center">
              <p className="text-[#faafe8] text-base md:text-lg font-bold">
                {new Date(competition.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(competition.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </p>
              <p className="text-[#00ffe7] text-sm mt-1">{competition.status.type.shortDetail}</p>
            </div>

            {/* Home Team */}
            <button 
              onClick={() => homeTeam?.id && navigate(`/nfl/team/${homeTeam.id}`)}
              className="flex flex-col items-center hover:bg-[#00ffe7]/10 rounded-lg p-3 transition-all group cursor-pointer"
            >
              <img 
                src={getTeamLogo(homeTeam?.team)} 
                alt={homeTeam?.team?.displayName}
                className="w-16 h-16 md:w-20 md:h-20 mb-2 group-hover:scale-110 transition-transform"
              />
              <h2 className="text-[#e0e7ef] font-bold text-sm md:text-base text-center max-w-full px-2 group-hover:text-[#00ffe7] transition-colors leading-tight">
                {homeTeam?.team?.displayName}
              </h2>
              <p className="text-[#b0b7bf] text-xs">{homeTeam?.records?.[0]?.summary}</p>
              <p className="text-[#00ffe7] text-3xl md:text-4xl font-bold mt-1">{homeTeam?.score || '0'}</p>
            </button>
          </div>
        </div>

        {/* Info Section - Game Overview */}
        <div id="info" ref={infoRef} className="space-y-6 scroll-mt-20">
          {/* Game Status & Situation */}
          <div className="bg-[#181a23]/90 border border-[#00ffe7]/30 rounded-xl shadow-[0_0_20px_rgba(0,255,231,0.1)] p-6">
            <div className="text-center mb-6">
              <h2 className="text-[#00ffe7] text-2xl font-bold mb-2">
                Game Info
              </h2>
              <h3 className="text-[#e0e7ef] text-xl">
                {competition.status.type.detail}
              </h3>
              {competition.status.type.state === 'in' && (
                <div className="flex items-center justify-center gap-4 text-[#e0e7ef]">
                  <span className="text-xl font-bold">{competition.status.displayClock}</span>
                  <span className="text-lg">Quarter {competition.status.period}</span>
                </div>
              )}
            </div>

              {/* Live Game Situation */}
              {competition.situation && competition.status.type.state === 'in' && (
                <div className="space-y-6">
                  {/* Current Drive Info */}
                  <div className="bg-[#1a1d2e]/50 rounded-xl p-4 border border-[#00ffe7]/20">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-center flex-1">
                        <p className="text-[#b0b7bf] text-sm mb-1">Possession</p>
                        <div className="flex items-center justify-center gap-2">
                          <img 
                            src={competition.situation.possession === homeTeam?.id ? homeTeam?.team.logo : awayTeam?.team.logo}
                            alt="Possession"
                            className="w-8 h-8"
                          />
                          <p className="text-[#00ffe7] font-bold text-lg">
                            {competition.situation.possession === homeTeam?.id ? homeTeam?.team.abbreviation : awayTeam?.team.abbreviation}
                          </p>
                        </div>
                      </div>
                      
                      {competition.situation.downDistanceText && (
                        <div className="text-center flex-1">
                          <p className="text-[#b0b7bf] text-sm mb-1">Down & Distance</p>
                          <p className="text-[#faafe8] font-bold text-lg">{competition.situation.downDistanceText}</p>
                        </div>
                      )}
                      
                      {competition.situation.possessionText && (
                        <div className="text-center flex-1">
                          <p className="text-[#b0b7bf] text-sm mb-1">Field Position</p>
                          <p className="text-[#e0e7ef] font-bold text-lg">{competition.situation.possessionText}</p>
                        </div>
                      )}
                    </div>

                    {/* Timeouts */}
                    <div className="flex justify-between items-center pt-4 border-t border-[#00ffe7]/10">
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
                  </div>

                  {/* Football Field Visualization */}
                  {competition.situation.lastPlay && (
                    <div className="bg-[#1a1d2e]/50 rounded-xl p-6 border border-[#00ffe7]/20">
                      <h4 className="text-[#00ffe7] font-bold text-lg mb-4 text-center">Last Play</h4>
                      
                      {/* Play Description */}
                      <div className="bg-[#23263a]/80 rounded-lg p-4 mb-6">
                        {(() => {
                          const playText = competition.situation.lastPlay.text;
                          // Split by period OR by PENALTY keyword
                          const parts = playText.split(/\.\s+(?=\w)|(?=PENALTY)/g).filter(part => part.trim());
                          
                          return (
                            <div className="space-y-2">
                              {parts.map((part, idx) => {
                                const trimmedPart = part.trim();
                                // const isPenalty = trimmedPart.startsWith('PENALTY');
                                
                                return (
                                  <div key={idx} className="flex items-start gap-2">
                                    <span className={`mt-1 text-[#00ffe7]`}>
                                      {'•'}
                                    </span>
                                    <p className={`text-sm flex-1 text-[#e0e7ef]`}>
                                      {trimmedPart}{trimmedPart.endsWith('.') ? '' : '.'}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                        
                        {competition.situation.lastPlay.statYardage !== undefined && (
                          <div className="mt-4 flex items-center justify-center gap-2 pt-2 border-t border-[#00ffe7]/10">
                            <span className="text-[#b0b7bf] text-xs">Yards:</span>
                            <span className={`font-bold text-lg ${
                              competition.situation.lastPlay.statYardage > 0 ? 'text-green-400' : 
                              competition.situation.lastPlay.statYardage < 0 ? 'text-red-400' : 
                              'text-gray-400'
                            }`}>
                              {competition.situation.lastPlay.statYardage > 0 ? '+' : ''}{competition.situation.lastPlay.statYardage}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Football Field */}
                      <div className="relative w-full bg-gradient-to-b from-green-700 to-green-800 rounded-lg overflow-hidden" style={{ height: '200px' }}>
                        {/* Yard lines */}
                        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((yard) => (
                          <div
                            key={yard}
                            className="absolute top-0 bottom-0 border-l border-white/20"
                            style={{ left: `${yard}%` }}
                          >
                            {yard % 10 === 0 && (
                              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-white/40 text-xs font-bold">
                                {yard === 0 ? '0' : yard === 50 ? '50' : yard < 50 ? yard : 100 - yard}
                              </div>
                            )}
                          </div>
                        ))}

                        {/* End zones */}
                        <div className="absolute left-0 top-0 bottom-0 w-[5%] bg-blue-900/40 flex items-center justify-center">
                          <span className="text-white/60 text-xs font-bold transform -rotate-90">{awayTeam?.team.abbreviation}</span>
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-[5%] bg-red-900/40 flex items-center justify-center">
                          <span className="text-white/60 text-xs font-bold transform -rotate-90">{homeTeam?.team.abbreviation}</span>
                        </div>

                        {/* 50 yard line highlight */}
                        <div className="absolute top-0 bottom-0 left-[50%] w-0.5 bg-yellow-400/30" />

                        {/* Start position */}
                        {competition.situation.lastPlay.start && (
                          <div
                            className="absolute top-4 transform -translate-x-1/2"
                            style={{ left: `${competition.situation.lastPlay.start.yardLine}%` }}
                          >
                            <div className="w-3 h-3 rounded-full bg-yellow-400 border-2 border-white shadow-lg" />
                          </div>
                        )}

                        {/* End position with player headshot */}
                        {competition.situation.lastPlay.end && competition.situation.lastPlay.athletesInvolved && competition.situation.lastPlay.athletesInvolved.length > 0 && (
                          <div
                            className="absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${competition.situation.lastPlay.end.yardLine}%` }}
                          >
                            <div className="relative group">
                              <img
                                src={competition.situation.lastPlay.athletesInvolved[0].headshot}
                                alt={competition.situation.lastPlay.athletesInvolved[0].displayName}
                                className="w-16 h-14 rounded-full border-4 border-[#00ffe7] shadow-2xl shadow-[#00ffe7]/50"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'w-12 h-12 rounded-full border-4 border-[#00ffe7] bg-[#23263a] flex items-center justify-center shadow-2xl shadow-[#00ffe7]/50';
                                    fallback.innerHTML = '<span class="text-[#00ffe7] font-bold text-xs">⬇️</span>';
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                              {/* Player name tooltip */}
                              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-[#23263a] border border-[#00ffe7]/50 rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <p className="text-[#00ffe7] text-xs font-bold">{competition.situation.lastPlay.athletesInvolved[0].displayName}</p>
                                <p className="text-[#b0b7bf] text-xs">{competition.situation.lastPlay.athletesInvolved[0].position}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Arrow showing play direction */}
                        {competition.situation.lastPlay.start && competition.situation.lastPlay.end && (
                          <svg
                            className="absolute top-1/2 left-0 w-full h-full pointer-events-none"
                            style={{ transform: 'translateY(-50%)' }}
                          >
                            <defs>
                              <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="10"
                                refX="9"
                                refY="3"
                                orient="auto"
                              >
                                <polygon points="0 0, 10 3, 0 6" fill="#00ffe7" />
                              </marker>
                            </defs>
                            <line
                              x1={`${competition.situation.lastPlay.start.yardLine}%`}
                              y1="20%"
                              x2={`${competition.situation.lastPlay.end.yardLine}%`}
                              y2="20%"
                              stroke="#00ffe7"
                              strokeWidth="3"
                              markerEnd="url(#arrowhead)"
                              opacity="0.7"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Win Probability (if available) */}
                      {competition.situation.lastPlay.probability && (
                        <div className="mt-6">
                          <h5 className="text-[#b0b7bf] text-sm text-center mb-3">Win Probability</h5>
                          <div className="relative h-8 bg-[#1a1d2e] rounded-full overflow-hidden">
                            <div
                              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#00ffe7] to-[#00ffe7]/70 transition-all duration-500"
                              style={{ width: `${competition.situation.lastPlay.probability.homeWinPercentage}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-between px-4 text-xs font-bold">
                              <span className="text-white drop-shadow-lg">
                                {awayTeam?.team.abbreviation} {competition.situation.lastPlay.probability.awayWinPercentage.toFixed(1)}%
                              </span>
                              <span className="text-white drop-shadow-lg">
                                {homeTeam?.team.abbreviation} {competition.situation.lastPlay.probability.homeWinPercentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Pre-game or Post-game Info */}
              {competition.status.type.state !== 'in' && (
                <div className="text-center">
                  {/* Line Scores */}
                  {(homeTeam?.linescores || awayTeam?.linescores) && (
                    <div className="bg-[#181a23]/90 border border-[#00ffe7]/30 rounded-xl shadow-[0_0_20px_rgba(0,255,231,0.1)] p-2">
                      <h4 className="text-[#00ffe7] font-bold text-lg mb-4">Scoring by Quarter</h4>
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
                </div>
              )}

            {/* Venue & Game Information - Combined */}
            <div className="bg-[#181a23]/90 border border-[#00ffe7]/30 rounded-xl shadow-[0_0_20px_rgba(0,255,231,0.1)] overflow-hidden">
              {/* Venue image if available from summary */}
              {venueImage && (
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={venueImage}
                    alt="Venue"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#181a23]" />
                  <div className="absolute bottom-4 left-6">
                    <h4 className="text-[#00ffe7] font-bold text-2xl flex items-center gap-2">
                      <FaFootballBall />
                      {summary?.gameInfo?.venue?.fullName || competition.venue?.fullName}
                    </h4>
                    <p className="text-[#e0e7ef] text-sm">
                      {summary?.gameInfo?.venue?.address?.city || competition.venue?.address?.city}, {summary?.gameInfo?.venue?.address?.state || competition.venue?.address?.state}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="p-6">
                {!venueImage && (competition.venue || summary?.gameInfo?.venue) && (
                  <div className="mb-6">
                    <h4 className="text-[#00ffe7] font-bold text-xl mb-3 flex items-center gap-2">
                      <FaFootballBall />
                      Venue
                    </h4>
                    <p className="text-[#e0e7ef] font-bold text-lg mb-1">
                      {summary?.gameInfo?.venue?.fullName || competition.venue?.fullName}
                    </p>
                    <p className="text-[#b0b7bf]">
                      {summary?.gameInfo?.venue?.address?.city || competition.venue?.address?.city}, {summary?.gameInfo?.venue?.address?.state || competition.venue?.address?.state}
                    </p>
                  </div>
                )}

                {/* Game Info Grid */}
                <div className="bg-[#23263a]/50 rounded-lg p-4 border border-[#00ffe7]/10">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                    {/* Venue Type */}
                    {(competition.venue || summary?.gameInfo?.venue) && (
                      <>
                        <span className="text-[#b0b7bf]">Venue:</span>
                        <span className="text-[#e0e7ef] font-semibold">
                          {(summary?.gameInfo?.venue?.indoor ?? competition.venue?.indoor) ? '🏠 Indoor' : '☀️ Outdoor'}
                        </span>
                      </>
                    )}

                    {/* Capacity */}
                    {summary?.gameInfo?.venue?.capacity && (
                      <>
                        <span className="text-[#b0b7bf]">Capacity:</span>
                        <span className="text-[#e0e7ef] font-semibold">{summary.gameInfo.venue.capacity.toLocaleString()}</span>
                      </>
                    )}

                    {/* Attendance */}
                    {summary?.gameInfo?.attendance && (
                      <>
                        <span className="text-[#b0b7bf]">Attendance:</span>
                        <span className="text-[#00ffe7] font-semibold">{summary.gameInfo.attendance.toLocaleString()}</span>
                      </>
                    )}

                    {/* Weather */}
                    {event.weather && (
                      <>
                        <span className="text-[#b0b7bf]">Weather:</span>
                        <span className="text-[#e0e7ef] font-semibold">{event.weather.displayValue} ({event.weather.temperature}°F)</span>
                      </>
                    )}

                    {/* Broadcast */}
                    {competition.broadcasts && competition.broadcasts.length > 0 && competition.broadcasts[0].names && (
                      <>
                        <span className="text-[#b0b7bf]">Broadcast:</span>
                        <span className="text-[#e0e7ef] font-semibold">{competition.broadcasts[0].names.join(', ')}</span>
                      </>
                    )}

                    {/* Spread */}
                    {competition.odds && competition.odds.length > 0 && (
                      <>
                        <span className="text-[#b0b7bf]">Spread:</span>
                        <span className="text-[#e0e7ef] font-semibold">{competition.odds[0].details}</span>
                      </>
                    )}

                    {/* Over/Under */}
                    {competition.odds && competition.odds.length > 0 && competition.odds[0].overUnder && (
                      <>
                        <span className="text-[#b0b7bf]">Over/Under:</span>
                        <span className="text-[#e0e7ef] font-semibold">{competition.odds[0].overUnder}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Stats Section */}
        {navPreset === 'summary' && (
          <div id="team" ref={teamRef} className="bg-[#181a23]/90 border border-[#00ffe7]/30 rounded-xl shadow-[0_0_20px_rgba(0,255,231,0.1)] p-6 scroll-mt-20">
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
                        <p className="font-bold text-lg text-[#00ffe7]">
                          {awayStat.displayValue}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#b0b7bf] text-sm font-semibold">
                          {awayStat.label}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg text-[#faafe8]">
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
        )}

        {/* Player Leaders Section */}
        {navPreset === 'scoreboard' && (
          <div id="player" ref={playerRef} className="bg-[#181a23]/90 border border-[#00ffe7]/30 rounded-xl shadow-[0_0_20px_rgba(0,255,231,0.1)] p-6 scroll-mt-20">
            <h3 className="text-[#00ffe7] font-bold text-2xl mb-6 flex items-center gap-2">
              <FaTrophy />
              Team Leaders
            </h3>
            
            {competition.leaders && competition.leaders.length > 0 ? (
              <div className="space-y-6">
                {competition.leaders.map((category, categoryIdx) => (
                  <div key={`${category.name}-${categoryIdx}`} className="border-b border-[#00ffe7]/10 pb-4">
                    <p className="text-[#b0b7bf] text-sm mb-3 text-center font-semibold">{category.displayName}</p>
                    <div className="space-y-2">
                      {category.leaders.map((leader, idx) => {
                        const isHome = leader.team.id === homeTeam?.id;
                        
                        return (
                          <div key={`${leader.athlete.id}-${idx}`} className={`flex items-center gap-3 ${isHome ? 'justify-start' : 'justify-end'}`}>
                            {!isHome && (
                              <div className="text-right min-w-0 flex-1">
                                <p className="text-[#e0e7ef] font-bold text-sm truncate">{leader.athlete.displayName}</p>
                                <p className="text-[#b0b7bf] text-xs">{leader.displayValue}</p>
                              </div>
                            )}
                            <img 
                              src={leader.athlete.headshot} 
                              alt={leader.athlete.displayName}
                              className="w-16 h-16 rounded-full flex-shrink-0"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            {isHome && (
                              <div className="text-left min-w-0 flex-1">
                                <p className="text-[#e0e7ef] font-bold text-sm truncate">{leader.athlete.displayName}</p>
                                <p className="text-[#b0b7bf] text-xs">{leader.displayValue}</p>
                              </div>
                            )}
                          </div>
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
        )}

        {/* Head to Head Section */}
        {navPreset === 'scoreboard' && homeTeam && awayTeam && (
          <div id="headtohead" ref={headtoheadRef} className="scroll-mt-20">
            <HeadToHead
              homeTeamId={homeTeam.id}
              awayTeamId={awayTeam.id}
              homeTeamName={homeTeam.team.displayName}
              awayTeamName={awayTeam.team.displayName}
            />
          </div>
        )}

        {/* Predictions Section */}
        {navPreset === 'summary' && (
          <div id="prediction" ref={predictionRef} className="scroll-mt-20">
            <Prediction
              gameId={gameId!}
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
        )}
        
        {/* Odds Section */}
        {navPreset === 'summary' && (
          <div id="odds" ref={oddsRef} className="scroll-mt-20">
            <Odds
              gameId={gameId!}
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
        )}
      </div>
    </div>
  );
};

export default NFLGame;
