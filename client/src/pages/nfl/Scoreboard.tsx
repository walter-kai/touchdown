import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrophy, FaFootballBall, FaChartBar, FaClock, FaPauseCircle } from 'react-icons/fa';
import HeadToHead from '@/components/nfl/HeadToHead';
import ProbChart from '@/components/nfl/ProbabilityChart';
import PlayerPick from '@/components/nfl/PlayerPick';
import { usePicks } from '@/providers/PicksContext';
import type { Event } from '@/types/espn/scoreboard';

interface ScoreboardViewProps {
  event: Event;
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
  const { getPicksWithHeadshots, isLocked, getCooldownTime } = usePicks();
  
  const competition = event.competitions[0];
  const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
  const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
  const isGameInSession = competition.status.type.state === 'in';
  const isGameUpcoming = competition.status.type.state === 'pre';

  // Get tab index for carousel position
  const getTabIndex = (tab: string) => {
    const scoreboardTabs = isGameUpcoming
      ? ['info', 'odds', 'headtohead']
      : ['info', 'player', 'pick', 'plays', 'odds', 'headtohead'];
    return scoreboardTabs.indexOf(tab);
  };

  // Update carousel position when tab changes
  useEffect(() => {
    if (carouselRef.current) {
      const index = getTabIndex(activeTab);
      if (index !== -1) {
        const totalSlides = isGameUpcoming ? 3 : 6;
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
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Carousel Container */}
        <div className="overflow-hidden relative">
          <div
            ref={carouselRef}
            className="flex transition-transform duration-500 ease-in-out"
            style={{ width: isGameUpcoming ? '300%' : '600%' }}
          >
            {/* Info Section - Game Overview */}
            <div className="w-full flex-shrink-0 space-y-6 py-6 overflow-y-auto max-h-screen" style={{ width: isGameUpcoming ? '33.333%' : '16.666%' }}>
              {/* Box Score */}
              <div className="p-6 mb-6">
                <div className="text-center mb-4">
                  <h2>
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
                                  src={competition.situation.possession === homeTeam?.id ? getTeamLogo(homeTeam?.team) : getTeamLogo(awayTeam?.team)}
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
                              <img src={getTeamLogo(awayTeam?.team)} alt="" className="w-12 h-12 opacity-60" />
                            </div>
                            <div className="absolute right-0 top-0 bottom-0 w-[10%] bg-red-900/40 flex items-center justify-center">
                              <img src={getTeamLogo(homeTeam?.team)} alt="" className="w-12 h-12 opacity-60" />
                            </div>

                            {/* Playing field - 80% between end zones */}
                            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((fieldPercent) => {
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

                            {/* Start position */}
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

                          {/* Latest Play */}
                          {playLog.length > 0 && (() => {
                            const latestPlay = playLog[0];
                            const team = latestPlay.possession === homeTeam?.id ? homeTeam : awayTeam;
                            const isHome = team?.id === homeTeam?.id;

                            return (
                              <div className="mt-4">
                                <div className="text-[#b0b7bf] text-xs mb-2 flex items-center gap-2">
                                  <FaFootballBall className="text-[#00ffe7]" />
                                  Latest Play
                                </div>
                                <div className={`bg-gradient-to-r ${isHome ? 'from-[#faafe8]/10' : 'from-[#00ffe7]/10'} rounded-lg p-3 border-l-2 ${isHome ? 'border-[#faafe8]' : 'border-[#00ffe7]'}`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <img src={getTeamLogo(team?.team)} alt="" className="w-5 h-5" />
                                    <span className={`text-xs font-bold ${isHome ? 'text-[#faafe8]' : 'text-[#00ffe7]'}`}>
                                      Q{latestPlay.quarter} {latestPlay.clock}
                                    </span>
                                  </div>
                                  
                                  {/* Player headshots */}
                                  {latestPlay.athletesInvolved && latestPlay.athletesInvolved.length > 0 && (
                                    <div className="flex gap-2 mb-2">
                                      {latestPlay.athletesInvolved.slice(0, 3).map((athlete, idx) => (
                                        athlete.headshot && (
                                          <div key={idx} className="flex items-center gap-1">
                                            <img
                                              src={athlete.headshot}
                                              alt={athlete.displayName}
                                              className="w-8 h-8 rounded-full border-2 border-[#00ffe7]/30"
                                            />
                                            <div className="flex flex-col">
                                              <span className="text-[#e0e7ef] text-xs font-semibold">{athlete.shortName}</span>
                                              <span className="text-[#b0b7bf] text-[10px]">{athlete.position}</span>
                                            </div>
                                          </div>
                                        )
                                      ))}
                                    </div>
                                  )}
                                  
                                  <p className="text-[#e0e7ef] text-xs">
                                    {latestPlay.text}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}

                          {/* My Picks Display with Headshots and Swap Button */}
                          {(() => {
                            if (!homeTeam?.id || !awayTeam?.id) return null;
                            
                            const picks = getPicksWithHeadshots(homeTeam.id, awayTeam.id);
                            if (!picks || picks.players.length === 0) return null;

                            const locked = isLocked(homeTeam.id, awayTeam.id);
                            const cooldownTime = getCooldownTime(homeTeam.id, awayTeam.id);
                            
                            // Calculate scores from playLog
                            const playerScores: Record<string, number> = {};
                            picks.players.forEach((player) => {
                              playerScores[player.id] = 0;
                            });
                            playLog.forEach((play) => {
                              if (play.athletesInvolved) {
                                play.athletesInvolved.forEach((athlete) => {
                                  if (playerScores.hasOwnProperty(athlete.id)) {
                                    playerScores[athlete.id] += 1;
                                  }
                                });
                              }
                            });
                            
                            return (
                              <div className="mt-4 bg-gradient-to-r from-[#00ffe7]/10 to-[#faafe8]/10 rounded-lg p-3 border border-[#00ffe7]/30">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-[#00ffe7] font-bold text-xs">MY PICKS</span>
                                  {picks.totalScore > 0 && (
                                    <span className="text-[#faafe8] font-bold text-xs">{picks.totalScore} pts</span>
                                  )}
                                </div>
                                <div className="flex gap-2 mb-3">
                                  {picks.players.map((player) => (
                                    <div key={player.id} className="flex-1 flex flex-col items-center bg-black/30 rounded p-2">
                                      <img
                                        src={player.headshot}
                                        alt={player.displayName}
                                        className="w-12 h-12 rounded-full border-2 border-[#00ffe7]/30 mb-1"
                                      />
                                      <div className="text-white text-xs font-bold text-center truncate w-full">{player.shortName || player.displayName}</div>
                                      <div className="text-[#b0b7bf] text-[10px]">{player.position.abbreviation}</div>
                                      <div className="mt-2 bg-[#00ffe7]/20 border-2 border-[#00ffe7] text-[#00ffe7] font-bold text-lg rounded px-3 py-1">
                                        {playerScores[player.id] || 0}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {locked ? (
                                  <div className="text-center py-2 bg-black/30 rounded">
                                    <span className="text-[#faafe8] text-xs font-bold">
                                      🔒 Locked - {Math.floor(cooldownTime / 60)}:{(cooldownTime % 60).toString().padStart(2, '0')}
                                    </span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => onTabChange('pick')}
                                    className="btn-pink w-full py-2 font-bold text-xs rounded"
                                  >
                                    SWAP NOW
                                  </button>
                                )}
                              </div>
                            );
                          })()}
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

                {/* Venue & Game Information */}
                <div className="overflow-hidden">
                  {competition.venue && (
                    <div className="p-4">
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

                      {/* Game Info Grid */}
                      <div className="bg-[#23263a]/50 rounded-lg p-3 border border-[#00ffe7]/10">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                          {competition.attendance && (
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
                          {competition.odds && competition.odds.length > 0 && competition.odds[0].details && (
                            <>
                              <span className="text-[#b0b7bf]">Spread:</span>
                              <span className="text-[#e0e7ef] font-semibold">{competition.odds[0].details}</span>
                            </>
                          )}
                          {competition.odds && competition.odds.length > 0 && competition.odds[0].overUnder && (
                            <>
                              <span className="text-[#b0b7bf]">Over/Under:</span>
                              <span className="text-[#e0e7ef] font-semibold">{competition.odds[0].overUnder}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Player Section */}
            {!isGameUpcoming && (
              <div className="w-full flex-shrink-0 py-6 overflow-y-auto max-h-screen" style={{ width: '16.666%' }}>
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
              </div>
            )}

            {/* Pick Section */}
            {!isGameUpcoming && (
              <div className="w-full flex-shrink-0 py-6 overflow-y-auto max-h-screen" style={{ width: '16.666%' }}>
                {homeTeam && awayTeam && (
                  <PlayerPick
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
                  />
                )}
              </div>
            )}

            {/* Plays Section */}
            {!isGameUpcoming && (
              <div className="w-full flex-shrink-0 py-6 overflow-y-auto max-h-screen" style={{ width: '16.666%' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[#00ffe7] font-bold text-2xl flex items-center gap-2">
                    <FaFootballBall />
                    Play Log
                  </h3>
                  {playLog.length > 0 && (
                    <span className="text-[#b0b7bf] text-xs">
                      {playLog.length} {playLog.length === 1 ? 'play' : 'plays'}
                    </span>
                  )}
                </div>

                {playLog.length > 0 ? (
                  <div className="space-y-4">
                    {playLog.map((play, idx) => {
                      const team = play.possession === homeTeam?.id ? homeTeam : awayTeam;
                      const isHome = team?.id === homeTeam?.id;
                      const borderColor = isHome ? 'border-[#faafe8]' : 'border-[#00ffe7]';
                      const bgGradient = isHome ? 'from-[#faafe8]/10' : 'from-[#00ffe7]/10';

                      return (
                        <div
                          key={`play-${idx}`}
                          className={`p-3 bg-gradient-to-r ${bgGradient} border-l-4 ${borderColor} rounded-lg`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {team && (
                                <img
                                  src={getTeamLogo(team.team)}
                                  alt={team.team.displayName}
                                  className="w-6 h-6"
                                />
                              )}
                              <span className="text-[#b0b7bf] text-xs font-semibold">
                                Q{play.quarter} - {play.clock}
                              </span>
                            </div>
                            <span className="text-[#b0b7bf] text-xs">
                              {Math.floor((new Date().getTime() - play.timestamp.getTime()) / 1000)}s ago
                            </span>
                          </div>
                          <p className="text-[#e0e7ef] text-sm">{play.text}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[#b0b7bf] text-center py-8">No plays recorded yet.</p>
                )}
              </div>
            )}

            {/* Odds Section */}
            <div className="w-full flex-shrink-0 py-6 overflow-y-auto max-h-screen" style={{ width: isGameUpcoming ? '33.333%' : '16.666%' }}>
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
            <div className="w-full flex-shrink-0 py-6 overflow-y-auto max-h-screen" style={{ width: isGameUpcoming ? '33.333%' : '16.666%' }}>
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
