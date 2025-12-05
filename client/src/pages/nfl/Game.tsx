import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaFootballBall, FaClock, FaChartBar, FaPauseCircle, FaTrophy } from 'react-icons/fa';
import axios from 'axios';
import ScoreboardView from './Scoreboard';
import SummaryView from './Summary';
import ProbChart from '@/components/nfl/ProbabilityChart';
import PlayerPick from '@/components/nfl/PlayerPick';
import HeadToHead from '@/components/nfl/HeadToHead';
import Prediction from '@/components/nfl/Prediction';

import type { Event, ScoreboardResponse } from '@/types/espn/scoreboard';
import type { Summary } from '@/types/espn/summary';

interface NFLGameProps {
  activeTab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays';
  onTabChange: (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays') => void;
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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [playLog, setPlayLog] = useState<Array<{ 
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
  }>>([]);
  const [isProbabilityExpanded, setIsProbabilityExpanded] = useState(false);
  const [isPlayerPickExpanded, setIsPlayerPickExpanded] = useState(false);
  const [gameCountdown, setGameCountdown] = useState<number>(0);
  
  // Carousel container ref
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Get tab index for carousel position
  const getTabIndex = (tab: string) => {
    const scoreboard = ['info', 'player', 'headtohead', 'plays'];
    const summary = ['info', 'player', 'headtohead', 'team', 'plays', 'prediction'];
    const tabs = navPreset === 'scoreboard' ? scoreboard : summary;
    return tabs.indexOf(tab);
  };
  
  // Update carousel position when tab changes
  useEffect(() => {
    if (carouselRef.current) {
      const index = getTabIndex(activeTab);
      if (index !== -1) {
        // Calculate the percentage to move based on the number of slides
        // For scoreboard (4 slides): each slide is 100/4 = 25% of viewport
        // For summary (6 slides): each slide is 100/6 = 16.666% of viewport
        const totalSlides = navPreset === 'scoreboard' ? 4 : 6;
        const slidePercentage = 100 / totalSlides;
        carouselRef.current.style.transform = `translateX(-${index * slidePercentage}%)`;
      }
    }
  }, [activeTab, navPreset]);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) return;

      try {
        if (!event) {
          setLoading(true);
        } else {
          setIsRefreshing(true);
        }
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
          
          // Fetch summary API if:
          // 1. Game not found in scoreboard (past/future games), OR
          // 2. Game is not live (pre/post game)
          if (!game || gameStatus !== 'in') {
            try {
              const summaryResponse = await axios.get<Summary>(
                `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`
              );
              console.log('Summary data fetched:', summaryResponse.data);
              console.log('Drives in summary:', summaryResponse.data.drives);
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
                setIsRefreshing(false);
                return;
              }
              // Otherwise continue without summary data
            }
          }
        }
        
        if (!game) {
          setError('Game data not available');
          setLoading(false);
          setIsRefreshing(false);
          return;
        }
        
        // Check if last play has changed and update timestamp
        if (game.competitions[0].situation?.lastPlay) {
          const currentPlayText = game.competitions[0].situation.lastPlay.text;
          const previousPlayText = event?.competitions[0].situation?.lastPlay?.text;
          
          if (currentPlayText !== previousPlayText) {
            const newPlay = {
              text: currentPlayText,
              quarter: game.competitions[0].status.period,
              clock: game.competitions[0].status.displayClock,
              timestamp: new Date(),
              yardage: game.competitions[0].situation.lastPlay.statYardage,
              possession: game.competitions[0].situation.possession,
              athletesInvolved: game.competitions[0].situation.lastPlay.athletesInvolved
            };
            setPlayLog(prev => [newPlay, ...prev]);
          }
        }
        
        // Set nav preset based on which API provided the data
        const preset = usedSummaryApi ? 'summary' : 'scoreboard';
        setNavPreset(preset);
        onPresetChange(preset);
        setEvent(game);
        setLastUpdated(new Date());
        setCountdown(30); // Reset countdown
        setLoading(false);
        setIsRefreshing(false);
      } catch (err) {
        console.error('Error fetching game data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load game data');
        setLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchGameData();
  }, [gameId]);

  // Countdown timer effect for auto-refresh (only for live games)
  useEffect(() => {
    if (!event) return; // Don't start countdown until initial load
    
    // Only auto-refresh if using scoreboard API (live games)
    if (navPreset === 'summary') return; // Don't refresh final games
    
    if (countdown <= 0) {
      // Trigger a new fetch by updating a dependency
      const fetchGameData = async () => {
        if (!gameId) return;

        try {
          setIsRefreshing(true);
          setError(null);

          let game: Event | undefined;
          let gameStatus: string | undefined;
          let usedSummaryApi = false;

          if (gameId === 'test') {
            const response = await axios.get<ScoreboardResponse>('/scoreboard.json');
            game = response.data.events?.[0];
            gameStatus = game?.competitions[0].status.type.state;
          } else {
            const scoreboardResponse = await axios.get<ScoreboardResponse>(
              `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`
            );
            game = scoreboardResponse.data.events?.find(e => e.id === gameId);
            gameStatus = game?.competitions[0].status.type.state;
          }
          
          if (!game || gameStatus !== 'in') {
            try {
              const summaryResponse = await axios.get<Summary>(
                `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`
              );
              setSummary(summaryResponse.data);
              usedSummaryApi = true;
              
              if (!game && summaryResponse.data.header) {
                game = summaryResponse.data.header as unknown as Event;
              }
            } catch (summaryErr) {
              console.error('Error fetching summary data:', summaryErr);
            }
          }
          
          if (game) {
            // Check if last play has changed and update timestamp
            if (game.competitions[0].situation?.lastPlay) {
              const currentPlayText = game.competitions[0].situation.lastPlay.text;
              const previousPlayText = event?.competitions[0].situation?.lastPlay?.text;
              
              if (currentPlayText !== previousPlayText) {
                const newPlay = {
                  text: currentPlayText,
                  quarter: game.competitions[0].status.period,
                  clock: game.competitions[0].status.displayClock,
                  timestamp: new Date(),
                  yardage: game.competitions[0].situation.lastPlay.statYardage,
                  possession: game.competitions[0].situation.possession,
                  athletesInvolved: game.competitions[0].situation.lastPlay.athletesInvolved
                };
                setPlayLog(prev => [newPlay, ...prev]);
              }
            }
            
            const preset = usedSummaryApi ? 'summary' : 'scoreboard';
            setNavPreset(preset);
            onPresetChange(preset);
            setEvent(game);
            setLastUpdated(new Date());
          }
          
          setCountdown(30);
          setIsRefreshing(false);
        } catch (err) {
          console.error('Error refreshing game data:', err);
          setIsRefreshing(false);
          setCountdown(30);
        }
      };

      fetchGameData();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, gameId, event, navPreset]);

  const handleManualRefresh = () => {
    setCountdown(0); // Trigger immediate refresh
  };

  // Update game countdown timer and switch to scoreboard when game starts
  useEffect(() => {
    if (!event) return;
    
    const competition = event.competitions[0];
    const gameStatus = competition.status.type.state;
    
    // Only run countdown for pre-game state
    if (gameStatus === 'pre') {
      const updateCountdown = () => {
        const now = new Date();
        const gameTime = new Date(competition.date);
        const diff = Math.max(0, gameTime.getTime() - now.getTime());
        setGameCountdown(diff);
        
        // If countdown reached zero and we're still in pre-game, switch to scoreboard and start refreshing
        if (diff === 0 && navPreset !== 'scoreboard') {
          setNavPreset('scoreboard');
          onPresetChange('scoreboard');
          setCountdown(0); // Trigger immediate refresh
        }
      };
      
      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);
      return () => clearInterval(timer);
    }
  }, [event, navPreset, onPresetChange]);

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
      <div className="min-h-screen max-w-7xl mx-auto py-8 px-4">

        {/* Auto-refresh indicator - only show for live games */}
        {/* {lastUpdated && navPreset === 'scoreboard' && (
          <div className="p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FaClock className="text-[#00ffe7]" />
                <span className="text-[#b0b7bf]">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
                {isRefreshing && (
                  <span className="text-[#faafe8] animate-pulse">Refreshing...</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[#b0b7bf]">
                  Next update in: <span className="text-[#00ffe7] font-bold">{countdown}s</span>
                </span>
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="bg-[#00ffe7]/20 hover:bg-[#00ffe7]/30 text-[#00ffe7] px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                >
                  Refresh Now
                </button>
              </div>
            </div>
          </div>
        )} */}

        {/* Carousel Container */}
        <div className="overflow-hidden relative min-h-screen">
          <div 
            ref={carouselRef}
            className="flex transition-transform duration-500 ease-in-out min-h-screen"
            style={{ width: `${navPreset === 'scoreboard' ? 400 : 600}%` }}
          >
            {/* Info Section - Game Overview */}
            <div className="w-full flex-shrink-0 space-y-6 py-6 overflow-y-auto max-h-screen" style={{ width: `${navPreset === 'scoreboard' ? 25 : 16.666}%` }}>
          {/* Box Score */}
          <div className="p-6 mb-6">
            <div className="text-center mb-4">
              <h2 className="">
                {new Date(competition.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                , {new Date(competition.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </h2>
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

          {/* Game Status & Situation */}
          <div>
            <div className="text-center mb-6">
              {competition.status.type.state === 'in' ? (
                // Live game
                <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500 rounded-full px-4 py-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-red-500 font-bold text-sm">LIVE</span>
                  <span className="text-[#e0e7ef] font-bold">Q{competition.status.period} - {competition.status.displayClock}</span>
                </div>
              ) : competition.status.type.state === 'post' ? (
                // Final game
                <div className="inline-flex items-center gap-2 bg-[#b0b7bf]/20 border border-[#b0b7bf] rounded-full px-4 py-2">
                  <span className="text-[#b0b7bf] font-bold">FINAL</span>
                </div>
              ) : (
                // Pre-game with countdown
                <div className="inline-flex items-center gap-2 bg-[#00ffe7]/20 border border-[#00ffe7] rounded-full px-4 py-2">
                  <span className="text-[#00ffe7] font-bold text-sm">STARTS IN</span>
                  <span className="text-[#e0e7ef] font-bold">
                    {(() => {
                      if (gameCountdown <= 0) return 'Soon';
                      
                      const days = Math.floor(gameCountdown / (1000 * 60 * 60 * 24));
                      const hours = Math.floor((gameCountdown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                      const minutes = Math.floor((gameCountdown % (1000 * 60 * 60)) / (1000 * 60));
                      const seconds = Math.floor((gameCountdown % (1000 * 60)) / 1000);
                      
                      if (days > 0) return `${days}d ${hours}h ${minutes}m`;
                      if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
                      if (minutes > 0) return `${minutes}m ${seconds}s`;
                      return `${seconds}s`;
                    })()}
                  </span>
                </div>
              )}
            </div>

              {/* Live Game Situation */}
              {competition.situation && competition.status.type.state === 'in' && (
                <div className="space-y-6">
                  {/* Football Field Visualization */}
                  {competition.situation.lastPlay && (
                    <div className="">
                  {/* Current Drive Info */}
                  <div className="mb-6">
                    {/* Down & Distance + Possession - Side by Side */}
                    <div className="flex items-center justify-between gap-4 mb-4">
                      {/* Down & Distance */}
                      {competition.situation.downDistanceText && (
                        <div className="flex-1 text-center">
                          <p className="text-[#b0b7bf] text-xs mb-2">Down & Distance</p>
                          <p className="text-[#faafe8] font-bold text-xl">{competition.situation.downDistanceText}</p>
                        </div>
                      )}
                      
                      {/* Possession */}
                      <div className="flex-1 text-center">
                        <p className="text-[#b0b7bf] text-xs mb-2">Possession</p>
                        <div className="flex items-center justify-center gap-2">
                          <img
                            src={competition.situation.possession === homeTeam?.id ? homeTeam?.team.logo : awayTeam?.team.logo}
                            alt="Possession"
                            className="w-10 h-10"
                          />
                          <p className="text-[#00ffe7] font-bold text-xl">
                            {competition.situation.possession === homeTeam?.id ? homeTeam?.team.abbreviation : awayTeam?.team.abbreviation}
                          </p>
                        </div>
                      </div>
                    </div>


                  </div>

                      {/* Field Visualization */}
                      <div className="border-t border-[#00ffe7]/10 pt-6 mb-6">
                        {/* Football Field */}
                        <div className="relative w-full bg-gradient-to-b from-green-700 to-green-800 rounded-lg overflow-hidden" style={{ height: '200px' }}>
                          {/* End zones - 10% each */}
                          <div className="absolute left-0 top-0 bottom-0 w-[10%] bg-blue-900/40 flex items-center justify-center">
                            <img src={awayTeam?.team.logo} alt="" className="w-12 h-12 opacity-60" />
                          </div>
                          <div className="absolute right-0 top-0 bottom-0 w-[10%] bg-red-900/40 flex items-center justify-center">
                            <img src={homeTeam?.team.logo} alt="" className="w-12 h-12 opacity-60" />
                          </div>

                          {/* Playing field - 80% between end zones */}
                          {/* Yard lines at 0, 10, 20, 30, 40, 50, 40, 30, 20, 10, 0 */}
                          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((fieldPercent) => {
                            // Map field percentage to actual position (10% offset for end zone)
                            const actualPosition = 10 + (fieldPercent * 0.8);
                            const yardNumber = fieldPercent <= 50 ? fieldPercent : 100 - fieldPercent;
                            
                            return (
                              <div
                                key={fieldPercent}
                                className="absolute top-0 bottom-0 border-l border-white/20"
                                style={{ left: `${actualPosition}%` }}
                              >
                                {fieldPercent % 10 === 0 && (
                                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-white/40 text-xs font-bold">
                                    {yardNumber}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* 50 yard line highlight */}
                          <div className="absolute top-0 bottom-0 left-[50%] w-0.5 bg-yellow-400/30" />

                          {/* Start position (aligned vertically with end/arrow) */}
                          {competition.situation.lastPlay.start && (
                            <div
                              className="absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                              style={{ left: `${10 + (competition.situation.lastPlay.start.yardLine * 0.8)}%` }}
                            >
                              <div className="w-3 h-3 rounded-full bg-yellow-400 border-2 border-white shadow-lg" />
                            </div>
                          )}

                          {/* End position with player headshot */}
                          {competition.situation.lastPlay.end && competition.situation.lastPlay.athletesInvolved && competition.situation.lastPlay.athletesInvolved.length > 0 && (
                            <div
                              className="absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
                              style={{ left: `${10 + (competition.situation.lastPlay.end.yardLine * 0.8)}%` }}
                            >
                              <div className="relative group">
                                <div className="w-16 h-16 rounded-full bg-yellow-400/30 flex items-center justify-center border-4 border-yellow-400 shadow-2xl shadow-yellow-400/50">
                                  <img
                                  src={competition.situation.lastPlay.athletesInvolved[0].headshot}
                                  alt={competition.situation.lastPlay.athletesInvolved[0].displayName}
                                  className="w-14 h-14 rounded-full object-cover z-1"
                                  onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const parent = e.currentTarget.parentElement;
                                      if (parent) {
                                        const fallback = document.createElement('div');
                                        fallback.className = 'flex items-center justify-center';
                                        fallback.innerHTML = '<span class="text-[#00ffe7] font-bold text-xs">⬇️</span>';
                                        parent.appendChild(fallback);
                                      }
                                    }}
                                  />
                                </div>
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
                              className="absolute top-1/2 left-0 w-full h-full pointer-events-none z-0"
                              style={{ transform: 'translateY(-50%)' }}
                            >
                              <defs>
                                <marker
                                  id="arrowhead"
                                  markerWidth="8"
                                  markerHeight="6"
                                  refX="8"
                                  refY="2"
                                  orient="auto"
                                >
                                  <polygon points="0 0, 8 2, 0 4" fill="#00ffe7" />
                                </marker>
                              </defs>
                              <line
                                x1={`${10 + (competition.situation.lastPlay.start.yardLine * 0.8)}%`}
                                y1="50%"
                                x2={`${10 + (competition.situation.lastPlay.end.yardLine * 0.8)}%`}
                                y2="50%"
                                stroke="#00ffe7"
                                strokeWidth="3"
                                markerEnd="url(#arrowhead)"
                                opacity="0.7"
                              />
                            </svg>
                          )}
                        </div>
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

                        {/* Live Win Probability */}
                        <div className="mt-6">
                          <div className="">
                            <button
                              onClick={() => setIsProbabilityExpanded(!isProbabilityExpanded)}
                              className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#00ffe7]/5 transition-colors"
                            >
                              <h3 className="text-[#00ffe7] font-bold text-xl flex items-center gap-2">
                                <FaChartBar />
                                Live Win Probability
                              </h3>
                              <span className={`text-[#00ffe7] transition-transform ${isProbabilityExpanded ? 'rotate-180' : ''}`}>
                                ▼
                              </span>
                            </button>
                            {isProbabilityExpanded && (
                              <div className="pb-6">
                                <ProbChart
                                  gameId={gameId!}
                                  competitionId={competition.id}
                                  gameStatus={competition.status.type.state}
                                  homeTeamInfo={{
                                    name: homeTeam?.team.displayName || '',
                                    logo: getTeamLogo(homeTeam),
                                    color: homeTeam?.team.color || 'faafe8'
                                  }}
                                  awayTeamInfo={{
                                    name: awayTeam?.team.displayName || '',
                                    logo: getTeamLogo(awayTeam),
                                    color: awayTeam?.team.color || '00ffe7'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Player Pick */}
                        <div className="mt-6">
                          <div className="">
                            {/* Always render PlayerPick component to check lock state */}
                            <PlayerPick
                              homeTeamId={homeTeam?.id || ''}
                              awayTeamId={awayTeam?.id || ''}
                              homeTeamInfo={{
                                name: homeTeam?.team.displayName || '',
                                logo: getTeamLogo(homeTeam),
                                color: homeTeam?.team.color || 'faafe8'
                              }}
                              awayTeamInfo={{
                                name: awayTeam?.team.displayName || '',
                                logo: getTeamLogo(awayTeam),
                                color: awayTeam?.team.color || '00ffe7'
                              }}
                              isExpanded={isPlayerPickExpanded}
                              onToggle={() => setIsPlayerPickExpanded(!isPlayerPickExpanded)}
                              playLog={playLog}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Current Possession Section */}
                      {playLog.length > 0 && playLog[0]?.possession && (
                        <div className="pt-6 mb-6">
                          <div className="bg-[#00ffe7]/10 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                              <img src={(playLog[0].possession === homeTeam?.id ? homeTeam : awayTeam)?.team.logo} alt="" className="w-6 h-6" />
                              <span className="text-[#00ffe7] font-bold text-sm">
                                Current Possession: {(playLog[0].possession === homeTeam?.id ? homeTeam : awayTeam)?.team.abbreviation}
                              </span>
                            </div>
                            {playLog.slice(0, playLog.findIndex((p, i) => i > 0 && p.possession !== playLog[0].possession) || playLog.length)
                              .flatMap(p => p.athletesInvolved || [])
                              .filter((athlete, index, self) => self.findIndex(a => a.id === athlete.id) === index).length > 0 && (
                              <div>
                                <p className="text-[#b0b7bf] text-xs mb-2">Players Involved:</p>
                                <div className="flex flex-wrap gap-2">
                                  {playLog.slice(0, playLog.findIndex((p, i) => i > 0 && p.possession !== playLog[0].possession) || playLog.length)
                                    .flatMap(p => p.athletesInvolved || [])
                                    .filter((athlete, index, self) => self.findIndex(a => a.id === athlete.id) === index)
                                    .map((athlete) => (
                                      <div key={athlete.id} className="flex items-center gap-1.5 bg-[#1a1d2e]/50 rounded-full px-2 py-1 border border-[#00ffe7]/30">
                                        <img src={athlete.headshot} alt="" className="w-5 h-5 rounded-full" 
                                          onError={(e) => e.currentTarget.style.display = 'none'} />
                                        <span className="text-white text-xs">#{athlete.jersey}</span>
                                        <span className="text-gray-300 text-xs font-semibold">{athlete.shortName}</span>
                                        <span className="text-[#b0b7bf] text-xs">{athlete.position}</span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
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
            <div className="overflow-hidden">
              {/* Venue image if available from summary */}
              {venueImage && (
                <div className="relative h-24 overflow-hidden">
                  <img 
                    src={venueImage}
                    alt="Venue"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#181a23]" />
                  <div className="absolute bottom-2 left-4">
                    <h4 className="text-[#00ffe7] font-bold text-sm flex items-center gap-1">
                      <FaFootballBall className="text-xs" />
                      {summary?.gameInfo?.venue?.fullName || competition.venue?.fullName}
                    </h4>
                    <p className="text-[#e0e7ef] text-xs">
                      {summary?.gameInfo?.venue?.address?.city || competition.venue?.address?.city}, {summary?.gameInfo?.venue?.address?.state || competition.venue?.address?.state}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="p-4">
                {!venueImage && (competition.venue || summary?.gameInfo?.venue) && (
                  <div className="mb-3">
                    <h4 className="text-[#00ffe7] font-bold text-sm mb-2 flex items-center gap-1">
                      <FaFootballBall className="text-xs" />
                      Venue
                    </h4>
                    <p className="text-[#e0e7ef] font-bold text-sm mb-1">
                      {summary?.gameInfo?.venue?.fullName || competition.venue?.fullName}
                    </p>
                    <p className="text-[#b0b7bf] text-xs">
                      {summary?.gameInfo?.venue?.address?.city || competition.venue?.address?.city}, {summary?.gameInfo?.venue?.address?.state || competition.venue?.address?.state}
                    </p>
                  </div>
                )}

                {/* Game Info Grid */}
                <div className="bg-[#23263a]/50 rounded-lg p-3 border border-[#00ffe7]/10">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1 text-xs">
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

            {/* Player Section */}
            <div className="w-full flex-shrink-0 py-6 overflow-y-auto" style={{ width: `${navPreset === 'scoreboard' ? 25 : 16.666}%` }}>
              {navPreset === 'scoreboard' && event && (
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
                            {category.leaders.map((leader, leaderIdx) => (
                              <button 
                                key={`${leader.athlete.id}-${leaderIdx}`}
                                onClick={() => navigate(`/nfl/player/${leader.athlete.id}`)}
                                className="w-full text-left hover:bg-[#00ffe7]/5 rounded-lg p-2 transition-all group cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={leader.athlete.headshot} 
                                    alt={leader.athlete.displayName}
                                    className="w-10 h-10 rounded-full group-hover:scale-110 transition-transform"
                                  />
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
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#b0b7bf] text-center py-8">No player leaders available at this time.</p>
                  )}
                </div>
              )}
              {navPreset === 'summary' && summary?.boxscore?.players && (
                <div className="space-y-4">
                  <h3 className="text-[#00ffe7] font-bold text-2xl mb-6 flex items-center gap-2">
                    <FaTrophy />
                    Player Statistics
                  </h3>
                  {summary.boxscore.players.length > 0 ? (
                    <div className="space-y-8">
                      {summary.boxscore.players.map((teamData, teamIdx) => (
                        <div key={`team-${teamIdx}`} className="space-y-4">
                          <div className="flex items-center gap-3 mb-4">
                            <img 
                              src={getTeamLogo(teamData.team)} 
                              alt={teamData.team.displayName}
                              className="w-10 h-10"
                            />
                            <h4 className="text-[#00ffe7] font-bold text-xl">{teamData.team.displayName}</h4>
                          </div>
                          {teamData.statistics.map((category, catIdx) => (
                            <div key={`${teamData.team.id}-${category.name}-${catIdx}`} className="bg-[#23263a]/50 rounded-lg p-2 sm:p-4 border border-[#00ffe7]/10">
                              <h5 className="text-[#b0b7bf] font-semibold text-xs sm:text-sm mb-2">{category.text}</h5>
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
                                              <p className="text-[#e0e7ef] font-semibold text-xs sm:text-sm truncate">{athleteData.athlete.displayName}</p>
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
            </div>

            {/* Head-to-Head Section */}
            <div className="w-full flex-shrink-0 py-6 overflow-y-auto" style={{ width: `${navPreset === 'scoreboard' ? 25 : 16.666}%` }}>
              {homeTeam && awayTeam && navPreset === 'scoreboard' && (
                <div>
                  <HeadToHead
                    homeTeamId={homeTeam.id}
                    awayTeamId={awayTeam.id}
                    homeTeamName={homeTeam.team.displayName}
                    awayTeamName={awayTeam.team.displayName}
                  />
                </div>
              )}
              {summary?.leaders && summary.leaders.length > 0 && navPreset === 'summary' && (
                <div>
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
                            const otherTeamGroup = summary.leaders.find(g => g.team.id !== teamLeaderGroup.team.id);
                            const otherCategory = otherTeamGroup?.leaders.find(c => c.name === category.name);
                            
                            if (!otherCategory || !category.leaders || !otherCategory.leaders || !category.leaders[0] || !otherCategory.leaders[0]) return null;
                            
                            const homeLeader = isHomeTeam ? category.leaders[0] : otherCategory.leaders[0];
                            const awayLeader = isAwayTeam ? category.leaders[0] : otherCategory.leaders[0];
                            
                            if (teamIdx !== 0) return null;
                            
                            return (
                              <div key={`category-${catIdx}`} className="bg-[#23263a]/50 rounded-lg p-4 border border-[#00ffe7]/10">
                                <h4 className="text-[#b0b7bf] font-semibold text-sm mb-4 text-center">{category.displayName}</h4>
                                <div className="grid grid-cols-3 gap-4 items-center">
                                  <div 
                                    className="flex flex-col items-center cursor-pointer hover:bg-[#00ffe7]/5 p-2 rounded transition-colors"
                                    onClick={() => navigate(`/nfl/player/${awayLeader.athlete.id}`)}
                                  >
                                    <img 
                                      src={awayLeader.athlete.headshot?.href || `https://robohash.org/${awayLeader.athlete.id}?set=set5`}
                                      alt={awayLeader.athlete.displayName}
                                      className="w-16 h-16 rounded-full mb-2 border-2 border-[#00ffe7]/30"
                                      onError={(e) => { e.currentTarget.src = `https://robohash.org/${awayLeader.athlete.id}?set=set5`; }}
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
                                  <div className="flex items-center justify-center">
                                    <span className="text-[#b0b7bf] text-sm font-bold">VS</span>
                                  </div>
                                  <div 
                                    className="flex flex-col items-center cursor-pointer hover:bg-[#faafe8]/5 p-2 rounded transition-colors"
                                    onClick={() => navigate(`/nfl/player/${homeLeader.athlete.id}`)}
                                  >
                                    <img 
                                      src={homeLeader.athlete.headshot?.href || `https://robohash.org/${homeLeader.athlete.id}?set=set5`}
                                      alt={homeLeader.athlete.displayName}
                                      className="w-16 h-16 rounded-full mb-2 border-2 border-[#faafe8]/30"
                                      onError={(e) => { e.currentTarget.src = `https://robohash.org/${homeLeader.athlete.id}?set=set5`; }}
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
            </div>

            {/* Plays Section - Scoreboard */}
            {navPreset === 'scoreboard' && (
              <div className="w-full flex-shrink-0 py-6 overflow-y-auto" style={{ width: '25%' }}>
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
                                  const parts = playText.split(/\.\n+\s+(?=\w)|(?=PENALTY)/g).filter(part => part.trim());
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
            )}

            {/* Team Stats Section - Summary only */}
            {navPreset === 'summary' && (
              <div className="w-full flex-shrink-0 py-6 overflow-y-auto" style={{ width: '16.666%' }}>
                {summary?.boxscore?.teams && summary.boxscore.teams.length === 2 && (
                  <div>
                    <h3 className="text-[#00ffe7] font-bold text-2xl mb-6 flex items-center gap-2">
                      <FaChartBar />
                      Team Statistics
                    </h3>
                    <div className="space-y-4">
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
                      {summary.boxscore.teams[0].statistics.map((_, statIdx) => {
                        const awayTeamData = summary.boxscore.teams.find(t => t.homeAway === 'away');
                        const homeTeamData = summary.boxscore.teams.find(t => t.homeAway === 'home');
                        const awayStat = awayTeamData?.statistics[statIdx];
                        const homeStat = homeTeamData?.statistics[statIdx];
                        
                        if (!awayStat || !homeStat) return null;
                        
                        return (
                          <div key={`stat-${statIdx}`} className="grid grid-cols-3 gap-4 items-center bg-[#23263a]/50 rounded-lg p-3 border border-[#00ffe7]/10">
                            <div className="text-center">
                              <p className="text-[#00ffe7] font-bold text-lg">{awayStat.displayValue}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[#b0b7bf] text-sm font-semibold">{awayStat.label}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[#00ffe7] font-bold text-lg">{homeStat.displayValue}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Plays Section - Summary only */}
            {navPreset === 'summary' && summary && (
              <div className="w-full flex-shrink-0 py-6 overflow-y-auto" style={{ width: '16.666%' }}>
                <h3 className="text-[#00ffe7] font-bold text-2xl mb-6 flex items-center gap-2">
                  <FaFootballBall />
                  Play by Play - All Drives
                </h3>
                {summary?.drives?.previous && summary.drives.previous.length > 0 ? (
                  <div className="space-y-6">
                    {summary.drives.previous.map((drive, driveIdx) => {
                      const driveTeam = drive.team;
                      const isHomeTeam = driveTeam.id === homeTeam?.id;
                      const bgClass = isHomeTeam ? 'from-[#faafe8]/10 border-l-4 border-[#faafe8]' : 'from-[#00ffe7]/10 border-l-4 border-[#00ffe7]';
                      
                      return (
                        <div key={`drive-${drive.id}-${driveIdx}`} className={`bg-gradient-to-r ${bgClass} rounded-lg py-4 mb-4`}>
                          <div className="flex items-center justify-between mb-3 px-4">
                            <div className="flex items-center gap-2">
                              <img src={getTeamLogo(driveTeam)} alt="" className="w-8 h-8" />
                              <span className={`font-bold text-sm ${isHomeTeam ? 'text-[#faafe8]' : 'text-[#00ffe7]'}`}>
                                {driveTeam.displayName} - {drive.description}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold text-sm ${isHomeTeam ? 'text-[#faafe8]' : 'text-[#00ffe7]'}`}>
                                {drive.displayResult}
                              </p>
                              <p className="text-[#b0b7bf] text-xs">
                                {drive.offensivePlays} plays, {drive.yards} yards, {drive.timeElapsed.displayValue}
                              </p>
                            </div>
                          </div>
                          {drive.plays && drive.plays.length > 0 && (
                            <div className="space-y-4 px-4">
                              {drive.plays.map((play, playIdx) => {
                                const playText = play.text;
                                const parts = playText.split(/\\.\\n+\\s+(?=\\w)|(?=PENALTY)/g).filter(part => part.trim());
                                
                                return (
                                  <div key={`play-${play.id}-${playIdx}`} className="relative flex items-start gap-4">
                                    <div className="relative flex flex-col items-center flex-shrink-0" style={{ width: '48px' }}>
                                      <div className={`w-4 h-4 rounded-full border-2 ${
                                        play.scoringPlay 
                                          ? 'bg-green-400 border-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' 
                                          : 'bg-[#23263a] border-[#00ffe7]/40'
                                      } z-10`}></div>
                                      <div className="text-center mt-1">
                                        <p className="text-[10px] font-bold text-[#00ffe7]">Q{play.period.number}</p>
                                        <p className="text-[9px] font-mono text-[#00ffe7]">{play.clock.displayValue}</p>
                                      </div>
                                    </div>
                                    <div className={`flex-1 pb-4 ${play.scoringPlay ? 'bg-green-500/5 -ml-2 pl-2 pr-2 rounded-lg' : ''}`}>
                                      <div className="space-y-1">
                                        {parts.map((part, partIdx) => {
                                          const trimmedPart = part.trim();
                                          const isTimeout = trimmedPart.toLowerCase().includes('timeout');
                                          return (
                                            <p key={partIdx} className={`text-sm ${
                                              play.scoringPlay ? 'text-green-400 font-medium' : 'text-[#b0b7bf]'
                                            } flex items-center gap-2`}>
                                              {isTimeout && <FaPauseCircle className="text-yellow-400 flex-shrink-0" />}
                                              <span>{trimmedPart}{trimmedPart.endsWith('.') ? '' : '.'}</span>
                                            </p>
                                          );
                                        })}
                                      </div>
                                      {play.scoringPlay && play.scoringType && (
                                        <div className="flex items-center gap-2 mt-2">
                                          <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded">
                                            {play.scoringType.displayName}
                                          </span>
                                        </div>
                                      )}
                                      {play.statYardage !== undefined && (
                                        <div className="flex items-center gap-2 mt-2">
                                          <span className="text-[#b0b7bf] text-xs">Yards:</span>
                                          <span className={`font-bold text-sm ${
                                            play.statYardage > 0 ? 'text-green-400' : play.statYardage < 0 ? 'text-red-400' : 'text-gray-400'
                                          }`}>{play.statYardage > 0 ? '+' : ''}{play.statYardage}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[#b0b7bf] mb-2">No drive data available.</p>
                  </div>
                )}
              </div>
            )}

            {/* Prediction Section - Summary only */}
            {navPreset === 'summary' && (
              <div className="w-full flex-shrink-0 py-6 overflow-y-auto" style={{ width: '16.666%' }}>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFLGame;
