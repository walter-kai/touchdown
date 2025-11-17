import React, { useState, useEffect } from "react";
import { FaFootballBall, FaPlay, FaClock, FaCalendar, FaNewspaper, FaSync, FaTv, FaMapMarkerAlt, FaUsers } from "react-icons/fa";
import type {
  Event,
  Competition,
  Competitor,
  Leader,
  Athlete,
  Team,
  Linescore,
  Situation,
  LastPlay,
  Weather,
  Status,
  Venue,
  TeamOnBye,
  Article,
  Image,
  Link
} from '@/types/Espn';

interface ESPNData {
  news?: {
    articles?: Article[];
  };
  content?: {
    sbData?: {
      week?: {
        teamsOnBye?: TeamOnBye[];
        number?: number;
      };
      leagues?: any[];
      events?: Event[];
    };
  };
}

const NFLScoreboard: React.FC = () => {
  const [games, setGames] = useState<Event[]>([]);
  const [news, setNews] = useState<Article[]>([]);
  const [byeTeams, setByeTeams] = useState<TeamOnBye[]>([]);
  const [weekNumber, setWeekNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(30);

  const fetchNFLData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://cdn.espn.com/core/nfl/scoreboard?xhr=1&limit=50');
      
      if (!response.ok) {
        throw new Error('Failed to fetch NFL data');
      }
      
      const data: ESPNData = await response.json();
      
      // Get games from content.sbData.events
      if (data.content?.sbData?.events) {
        console.log('Fetched games:', data.content.sbData.events.length);
        console.log('First game sample:', data.content.sbData.events[0]);
        setGames(data.content.sbData.events);
      }
      
      if (data.news?.articles) {
        setNews(data.news.articles);
      }
5
      if (data.content?.sbData?.week) {
        setByeTeams(data.content.sbData.week.teamsOnBye || []);
        setWeekNumber(data.content.sbData.week.number || null);
      }
      
      setLastUpdated(new Date());
      setCountdown(30); // Reset countdown to 30 seconds
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const handleManualRefresh = () => {
    fetchNFLData();
  };

  useEffect(() => {
    fetchNFLData();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (countdown <= 0) {
      fetchNFLData();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const getStatusBadge = (game: Event) => {
    const status = game.status.type.state;
    
    if (status === 'pre') {
      return (
        <span className="flex items-center gap-1 text-[#faafe8] text-sm">
          <FaCalendar className="text-xs" />
          {new Date(game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      );
    } else if (status === 'in') {
      return (
        <span className="flex items-center gap-1 text-[#00ffe7] text-sm animate-pulse">
          <FaPlay className="text-xs" />
          {game.status.displayClock} - Q{game.status.period}
        </span>
      );
    } else {
      return (
        <span className="text-gray-400 text-sm">
          Final
        </span>
      );
    }
  };

  const GameCard: React.FC<{ game: Event }> = ({ game }) => {
    const competition = game.competitions[0];
    const awayTeam = competition.competitors.find((c: Competitor) => c.homeAway === 'away');
    const homeTeam = competition.competitors.find((c: Competitor) => c.homeAway === 'home');

    if (!awayTeam || !homeTeam) return null;

    const awayRecord = awayTeam.records?.find((r: any) => r.type === 'total')?.summary || '';
    const homeRecord = homeTeam.records?.find((r: any) => r.type === 'total')?.summary || '';

    const isLive = competition.status.type.state === 'in';
    const isFinal = competition.status.type.completed;

    return (
      <div className="relative bg-[#181a23]/90 rounded-xl border border-[#00ffe7]/30 shadow-[0_0_20px_rgba(0,255,231,0.1)] p-3 sm:p-4 md:p-6 hover:border-[#00ffe7]/50 transition-all duration-300">
        
        {/* Header: Week, Status, Broadcast */}
        <div className="flex flex-wrap justify-between items-center gap-2 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-[#faafe8]/20">
          <div className="text-xs text-[#00ffe7]">
            Week {game.week.number}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">

            {isFinal && (
              <span className="text-gray-400 text-xs sm:text-sm font-bold">FINAL</span>
            )}
          </div>
          {competition.broadcast && (
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-[#faafe8]">
              <FaTv className="text-xs" />
              {competition.broadcast}
            </div>
          )}
        </div>

        {/* Weather */}
        {game.weather && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-[#23263a]/50 rounded-lg border border-[#faafe8]/20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl">🌤️</span>
                <div>
                  <div className="text-[10px] sm:text-xs text-gray-400">Weather</div>
                  <div className="text-xs sm:text-sm font-bold text-white">{game.weather.displayValue || game.weather.conditionId}</div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xl sm:text-2xl font-bold text-[#00ffe7]">{game.weather.temperature}°F</div>
                <div className="text-[10px] sm:text-xs text-gray-400">High: {game.weather.highTemperature}°F</div>
              </div>
            </div>
          </div>
        )}

        {/* Teams and Scores */}
        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
          {/* Away Team */}
          <div className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${awayTeam.winner ? 'bg-[#00ffe7]/10' : 'bg-[#23263a]/50'}`}>
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <img 
                src={awayTeam.team.logo} 
                alt={awayTeam.team.displayName}
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain flex-shrink-0"
              />
              <div className="min-w-0">
                <div className={`font-bold text-sm sm:text-base truncate ${awayTeam.winner ? 'text-[#00ffe7]' : 'text-white'}`}>
                  {awayTeam.team.displayName}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400">{awayRecord}</div>
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-bold flex-shrink-0 ml-2 ${awayTeam.winner ? 'text-[#00ffe7]' : 'text-white'}`}>
              {awayTeam.score}
            </div>
          </div>

          {/* Home Team */}
          <div className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${homeTeam.winner ? 'bg-[#00ffe7]/10' : 'bg-[#23263a]/50'}`}>
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <img 
                src={homeTeam.team.logo} 
                alt={homeTeam.team.displayName}
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain flex-shrink-0"
              />
              <div className="min-w-0">
                <div className={`font-bold text-sm sm:text-base truncate ${homeTeam.winner ? 'text-[#00ffe7]' : 'text-white'}`}>
                  {homeTeam.team.displayName}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400">{homeRecord}</div>
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-bold flex-shrink-0 ml-2 ${homeTeam.winner ? 'text-[#00ffe7]' : 'text-white'}`}>
              {homeTeam.score}
            </div>
          </div>
        </div>

        {/* Line Scores (Quarter by Quarter) */}
        {(awayTeam.linescores || homeTeam.linescores) && isFinal && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-[#23263a]/50 rounded-lg overflow-x-auto">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs min-w-max">
              <div className="text-gray-400 font-bold">Team</div>
              <div className="text-gray-400 font-bold hidden sm:block">Q1</div>
              <div className="text-gray-400 font-bold hidden sm:block">Q2</div>
              <div className="text-gray-400 font-bold hidden sm:block">Q3</div>
              <div className="text-gray-400 font-bold hidden sm:block">Q4</div>
              <div className="text-gray-400 font-bold">T</div>
              
              <div className="text-[#e0e7ef]">{awayTeam.team.abbreviation}</div>
              {awayTeam.linescores?.map((ls: Linescore, i: number) => (
                <div key={i} className="text-[#e0e7ef] hidden sm:block">{ls.displayValue}</div>
              ))}
              <div className="text-[#00ffe7] font-bold">{awayTeam.score}</div>
              
              <div className="text-[#e0e7ef]">{homeTeam.team.abbreviation}</div>
              {homeTeam.linescores?.map((ls: Linescore, i: number) => (
                <div key={i} className="text-[#e0e7ef] hidden sm:block">{ls.displayValue}</div>
              ))}
              <div className="text-[#00ffe7] font-bold">{homeTeam.score}</div>
            </div>
          </div>
        )}

        {/* Game Leaders */}
        {competition.leaders && competition.leaders.length > 0 && (
          <div className="space-y-2 mb-3 sm:mb-4">
            <div className="text-[10px] sm:text-xs font-bold text-[#faafe8] uppercase tracking-wider">Game Leaders</div>
            {competition.leaders.slice(0, 3).map((leader: Leader, idx: number) => {
              const topLeader = leader.leaders[0];
              return (
                <div key={idx} className="flex items-center gap-2 p-2 bg-[#23263a]/50 rounded-lg">
                  <img 
                    src={topLeader.athlete.headshot} 
                    alt={topLeader.athlete.displayName}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] sm:text-xs text-[#00ffe7] font-bold">{leader.abbreviation}</div>
                    <div className="text-xs sm:text-sm text-white truncate">{topLeader.athlete.displayName}</div>
                    <div className="text-[10px] sm:text-xs text-gray-400">{topLeader.displayValue}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Live Game Situation */}
        {isLive && competition.situation && (
          <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-r from-[#00ffe7]/10 to-[#faafe8]/10 rounded-lg border border-[#00ffe7]/30">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 sm:mb-3">
              <div className="flex items-center gap-2">
                <FaFootballBall className="text-sm sm:text-base text-[#00ffe7] animate-bounce" />
                <span className="text-xs sm:text-sm font-bold text-[#00ffe7]">LIVE SITUATION</span>
              </div>
              {competition.situation.isRedZone && (
                <span className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-[10px] sm:text-xs font-bold text-red-400">
                  RED ZONE
                </span>
              )}
            </div>
            
            {competition.situation.shortDownDistanceText && competition.situation.possessionText && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3">
                <div>
                  <div className="text-[10px] sm:text-xs text-gray-400 mb-1">Down & Distance</div>
                  <div className="text-base sm:text-lg font-bold text-white">{competition.situation.shortDownDistanceText}</div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-gray-400 mb-1">Ball Position</div>
                  <div className="text-base sm:text-lg font-bold text-white">{competition.situation.possessionText}</div>
                </div>
              </div>
            )}

            {(competition.situation.homeTimeouts !== undefined || competition.situation.awayTimeouts !== undefined) && (
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3">
                {competition.situation.homeTimeouts !== undefined && (
                  <div>
                    <div className="text-[10px] sm:text-xs text-gray-400 mb-1">Home Timeouts</div>
                    <div className="text-xs sm:text-sm text-[#faafe8]">⏱️ × {competition.situation.homeTimeouts}</div>
                  </div>
                )}
                {competition.situation.awayTimeouts !== undefined && (
                  <div>
                    <div className="text-[10px] sm:text-xs text-gray-400 mb-1">Away Timeouts</div>
                    <div className="text-xs sm:text-sm text-[#faafe8]">⏱️ × {competition.situation.awayTimeouts}</div>
                  </div>
                )}
              </div>
            )}

            {competition.situation.lastPlay && (
              <div className="pt-3 sm:pt-4 border-t border-[#00ffe7]/20 space-y-2 sm:space-y-3 md:space-y-4">
                <div className="text-[10px] sm:text-xs font-bold text-[#00ffe7] uppercase tracking-wider flex items-center gap-1 sm:gap-2">
                  <FaFootballBall className="text-xs sm:text-sm animate-pulse" />
                  Last Play
                </div>
                
                {/* Play Description */}
                <div className="bg-[#23263a]/70 rounded-lg p-2 sm:p-3 border border-[#faafe8]/20">
                  <div className="text-xs sm:text-sm text-[#e0e7ef] leading-relaxed">
                    {competition.situation.lastPlay.text}
                  </div>
                </div>

                {/* Mini Football Field Visualization */}
                {competition.situation.lastPlay.start && competition.situation.lastPlay.end && (
                  <div className="bg-gradient-to-b from-green-900/30 to-green-800/30 rounded-lg p-2 sm:p-3 md:p-4 border border-green-600/30">
                    <div className="relative h-16 sm:h-20 md:h-24 mb-2 sm:mb-3">
                      {/* Left Endzone with Away Team Logo */}
                      <div className="absolute left-0 top-0 bottom-0 w-[8%] bg-gradient-to-r from-blue-900/40 to-transparent flex items-center justify-center">
                        <img 
                          src={awayTeam.team.logo} 
                          alt={awayTeam.team.abbreviation}
                          className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain opacity-60"
                        />
                      </div>
                      
                      {/* Right Endzone with Home Team Logo */}
                      <div className="absolute right-0 top-0 bottom-0 w-[8%] bg-gradient-to-l from-red-900/40 to-transparent flex items-center justify-center">
                        <img 
                          src={homeTeam.team.logo} 
                          alt={homeTeam.team.abbreviation}
                          className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain opacity-60"
                        />
                      </div>
                      
                      {/* Game Status Overlay */}
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20">
                        {isLive && (
                          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 bg-black/80 border border-[#00ffe7]/50 rounded-full">
                            <FaPlay className="text-[8px] sm:text-[10px] text-[#00ffe7]" />
                            <span className="text-[8px] sm:text-[10px] md:text-xs font-bold text-[#00ffe7] whitespace-nowrap">
                              LIVE - Q{competition.status.period} {competition.status.displayClock}
                            </span>
                          </div>
                        )}
                        {!isLive && !isFinal && (
                          <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-black/80 border border-[#faafe8]/50 rounded-full">
                            <span className="text-[8px] sm:text-[10px] md:text-xs text-[#faafe8] font-bold whitespace-nowrap">
                              {new Date(game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Field Lines */}
                      <div className="absolute inset-0 flex px-[8%]">
                        {[...Array(11)].map((_, i) => (
                          <div key={i} className="flex-1 border-r border-green-600/40 relative">
                            {i % 5 === 0 && (
                              <div className="absolute -bottom-4 sm:-bottom-5 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] text-green-400/60 font-bold">
                                {i * 10}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Play Start Position */}
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-[#faafe8] rounded-full shadow-[0_0_10px_rgba(250,175,232,0.6)] z-10"
                        style={{ left: `calc(8% + ${competition.situation.lastPlay.start.yardLine}% * 0.84)` }}
                      >
                        <div className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] sm:text-[10px] text-[#faafe8] font-bold">
                          START
                        </div>
                      </div>
                      
                      {/* Play Arrow/Line */}
                      <svg className="absolute top-1/2 -translate-y-1/2 h-1 z-10" style={{ 
                        left: `calc(8% + ${Math.min(competition.situation.lastPlay.start.yardLine, competition.situation.lastPlay.end.yardLine)}% * 0.84)`,
                        width: `calc(${Math.abs(competition.situation.lastPlay.end.yardLine - competition.situation.lastPlay.start.yardLine)}% * 0.84)`
                      }}>
                        <defs>
                          <marker id={`arrowhead-${game.id}`} markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                            <polygon points="0 0, 10 3, 0 6" fill="#00ffe7" />
                          </marker>
                        </defs>
                        <line 
                          x1="0" 
                          y1="50%" 
                          x2="100%" 
                          y2="50%" 
                          stroke="#00ffe7" 
                          strokeWidth="2"
                          markerEnd={`url(#arrowhead-${game.id})`}
                          className="animate-pulse"
                        />
                      </svg>
                      
                      {/* Play End Position */}
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-[#00ffe7] rounded-full shadow-[0_0_10px_rgba(0,255,231,0.6)] z-10"
                        style={{ left: `calc(8% + ${competition.situation.lastPlay.end.yardLine}% * 0.84)` }}
                      >
                        <div className="absolute -bottom-5 sm:-bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] sm:text-[10px] text-[#00ffe7] font-bold">
                          END
                        </div>
                      </div>
                    </div>
                    
                    {/* Yardage Gained */}
                    <div className="text-center">
                      <div className="inline-flex items-center gap-1 sm:gap-2 bg-[#00ffe7]/20 px-2 sm:px-3 py-1 rounded-full border border-[#00ffe7]/40">
                        <span className="text-[10px] sm:text-xs text-gray-400">Yards:</span>
                        <span className="text-base sm:text-lg font-bold text-[#00ffe7]">
                          {competition.situation.lastPlay.statYardage > 0 ? '+' : ''}{competition.situation.lastPlay.statYardage}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Win Probability Bar */}
                {competition.situation.lastPlay.probability && (
                  <div className="space-y-1 sm:space-y-2">
                    <div className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase">Win Probability</div>
                    <div className="relative h-6 sm:h-7 md:h-8 bg-[#23263a] rounded-lg overflow-hidden border border-[#00ffe7]/30">
                      {/* Home Team Probability */}
                      <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#00ffe7]/70 to-[#00ffe7]/40 transition-all duration-500"
                        style={{ width: `${competition.situation.lastPlay.probability.homeWinPercentage * 100}%` }}
                      />
                      {/* Away Team Probability */}
                      <div 
                        className="absolute right-0 top-0 h-full bg-gradient-to-l from-[#faafe8]/70 to-[#faafe8]/40 transition-all duration-500"
                        style={{ width: `${competition.situation.lastPlay.probability.awayWinPercentage * 100}%` }}
                      />
                      {/* Labels */}
                      <div className="absolute inset-0 flex items-center justify-between px-2 sm:px-3 text-[10px] sm:text-xs font-bold">
                        <span className="text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] z-10 truncate">
                          {homeTeam.team.abbreviation}: {(competition.situation.lastPlay.probability.homeWinPercentage * 100).toFixed(1)}%
                        </span>
                        <span className="text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] z-10 truncate">
                          {awayTeam.team.abbreviation}: {(competition.situation.lastPlay.probability.awayWinPercentage * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Athletes Involved with Headshots */}
                {competition.situation.lastPlay.athletesInvolved && competition.situation.lastPlay.athletesInvolved.length > 0 && (
                  <div className="space-y-1 sm:space-y-2">
                    <div className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase">Players Involved</div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {competition.situation.lastPlay.athletesInvolved.map((athlete: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1.5 sm:gap-2 bg-[#23263a]/70 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-[#faafe8]/20">
                          {athlete.headshot && (
                            <img 
                              src={athlete.headshot} 
                              alt={athlete.displayName}
                              className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full object-cover border-2 border-[#00ffe7]/50 flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div className="text-[10px] sm:text-xs min-w-0">
                            <div className="text-white font-bold truncate">{athlete.displayName}</div>
                            {athlete.position && (
                              <div className="text-gray-400">{athlete.position.abbreviation}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drive Info */}
                {competition.situation.lastPlay.drive && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2 text-[10px] sm:text-xs bg-[#23263a]/50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-[#faafe8]/20">
                    <div className="min-w-0">
                      <span className="text-gray-400">Drive: </span>
                      <span className="text-[#e0e7ef]">{competition.situation.lastPlay.drive.description}</span>
                    </div>
                    {competition.situation.lastPlay.drive.timeElapsed && (
                      <div className="flex-shrink-0">
                        <span className="text-gray-400">Time: </span>
                        <span className="text-[#00ffe7] font-bold">{competition.situation.lastPlay.drive.timeElapsed.displayValue}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Venue Info */}
        {competition.venue && (
          <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-400 pt-2 sm:pt-3 border-t border-[#faafe8]/20">
            <FaMapMarkerAlt className="flex-shrink-0" />
            <span className="truncate">{competition.venue.fullName}, {competition.venue.address.city}, {competition.venue.address.state}</span>
          </div>
        )}

        {/* Corner Accents */}
        <span className="absolute top-0 left-0 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border-t-2 border-l-2 border-[#00ffe7] rounded-tl-xl opacity-60" />
        <span className="absolute top-0 right-0 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border-t-2 border-r-2 border-[#00ffe7] rounded-tr-xl opacity-60" />
        <span className="absolute bottom-0 left-0 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border-b-2 border-l-2 border-[#00ffe7] rounded-bl-xl opacity-60" />
        <span className="absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border-b-2 border-r-2 border-[#00ffe7] rounded-br-xl opacity-60" />
      </div>
    );
  };

  const NewsCard: React.FC<{ article: Article }> = ({ article }) => {
    const image = article.images && article.images.length > 0 ? article.images[0] : null;

    return (
      <a
        href={article.links.web.href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 w-64 sm:w-72 md:w-80 bg-[#181a23]/90 rounded-lg border border-[#faafe8]/30 overflow-hidden hover:border-[#faafe8]/50 transition-all duration-300 group"
      >
        <div className="flex gap-2 sm:gap-3 p-2 sm:p-3">
          {image && (
            <div className="relative overflow-hidden w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded">
              <img 
                src={image.url} 
                alt={article.headline}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xs sm:text-sm text-[#faafe8] mb-1 group-hover:text-[#00ffe7] transition-colors line-clamp-2">
              {article.headline}
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-2">
              {article.description}
            </p>
          </div>
        </div>
      </a>
    );
  };

  return (
		<div className="max-w-7xl mx-auto px-2 sm:px-4 py-16 sm:py-20">
	
	{/* Header */}
	<div className="mb-4 sm:mb-6 text-center">
		<div className="flex items-center justify-center gap-2 sm:gap-4 mb-3 sm:mb-4">
		<FaFootballBall className="text-2xl sm:text-3xl md:text-4xl text-[#00ffe7]" />
		<h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#00ffe7] drop-shadow-[0_0_8px_#00ffe7] tracking-wide sm:tracking-widest">
			NFL SCOREBOARD {weekNumber && <span className="hidden sm:inline">- WEEK {weekNumber}</span>}
			{weekNumber && <span className="sm:hidden block text-sm mt-1">Week {weekNumber}</span>}
		</h1>
		<FaFootballBall className="text-2xl sm:text-3xl md:text-4xl text-[#00ffe7]" />
		</div>
		
		<div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
		{lastUpdated && (
			<span className="text-sm text-[#e0e7ef]">
			Last updated: {lastUpdated.toLocaleTimeString()}
			</span>
		)}
		<button
			onClick={handleManualRefresh}
			disabled={loading}
			className="flex items-center gap-2 px-4 py-2 bg-[#00ffe7]/20 border border-[#00ffe7]/30 rounded-lg text-[#00ffe7] hover:bg-[#00ffe7]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
		>
			<FaSync className={loading ? 'animate-spin' : ''} />
			{loading ? 'Refreshing...' : `Refresh (${countdown}s)`}
		</button>
		</div>
	</div>

	{/* News Ticker - Horizontal Scroll */}
	{news.length > 0 && (
		<div className="mb-6 bg-[#181a23]/90 rounded-xl border border-[#faafe8]/30 p-4 shadow-[0_0_16px_rgba(250,175,232,0.1)]">
		<div className="flex items-center gap-2 mb-3">
			<FaNewspaper className="text-[#faafe8]" />
			<h2 className="text-lg font-bold text-[#faafe8]">Latest News</h2>
		</div>
		<div className="overflow-x-auto custom-scrollbar">
			<div className="flex gap-4 pb-2">
			{news.map(article => (
				<NewsCard key={article.id} article={article} />
			))}
			</div>
		</div>
		</div>
	)}

	{/* Teams on Bye */}
	{byeTeams.length > 0 && (
		<div className="mb-6 bg-[#181a23]/90 rounded-xl border border-[#faafe8]/30 p-3 sm:p-4 shadow-[0_0_16px_rgba(250,175,232,0.1)]">
		<div className="flex items-center gap-2 mb-3">
			<FaUsers className="text-base sm:text-lg text-[#faafe8]" />
			<h2 className="text-base sm:text-lg font-bold text-[#faafe8]">Teams on Bye</h2>
		</div>
		<div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
			{byeTeams.map(team => (
			<div key={team.id} className="flex items-center gap-1.5 sm:gap-2 bg-[#23263a]/50 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-lg border border-[#00ffe7]/20">
				<img 
				src={team.logo} 
				alt={team.displayName}
				className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 object-contain"
				/>
				<span className="text-xs sm:text-sm text-[#e0e7ef] font-medium">{team.displayName}</span>
			</div>
			))}
		</div>
		</div>
	)}

	{/* Loading State */}
	{loading && games.length === 0 && (
		<div className="text-center py-12 sm:py-16 md:py-20">
		<FaClock className="text-4xl sm:text-5xl md:text-6xl text-[#00ffe7] mx-auto mb-3 sm:mb-4 animate-pulse" />
		<p className="text-[#e0e7ef] text-base sm:text-lg md:text-xl">Loading NFL scores...</p>
		</div>
	)}

	{/* Error State */}
	{error && (
		<div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 sm:p-5 md:p-6 text-center">
		<p className="text-red-400 font-bold mb-2 text-sm sm:text-base">Error loading data</p>
		<p className="text-[#e0e7ef] text-xs sm:text-sm">{error}</p>
		</div>
	)}

	{/* Games Grid */}
	{!loading && games.length > 0 && (() => {
		const liveGames = games.filter(game => game.status.type.state === 'in');
		const otherGames = games.filter(game => game.status.type.state !== 'in');
		
		return (
		<>
			{/* Live Games Featured Section */}
			{liveGames.length > 0 && (
			<div className="mb-8 sm:mb-10 md:mb-12">
				<div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
				<div className="relative">
					<FaPlay className="text-xl sm:text-2xl text-[#00ffe7] animate-pulse" />
					<span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
				</div>
				<h2 className="text-xl sm:text-2xl font-bold text-[#00ffe7]">
					Live Games
				</h2>
				<span className="px-2 sm:px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full text-xs sm:text-sm font-bold text-red-400 animate-pulse">
					{liveGames.length} LIVE
				</span>
				</div>
				<div className="gap-4 sm:gap-5 md:gap-6">
				{liveGames.map(game => (
					<GameCard key={game.id} game={game} />
				))}
				</div>
			</div>
			)}
			
			{/* Other Games */}
			{otherGames.length > 0 && (
			<div className="mb-8 sm:mb-10 md:mb-12">
				<h2 className="text-xl sm:text-2xl font-bold text-[#00ffe7] mb-4 sm:mb-5 md:mb-6 flex items-center gap-2">
				<FaFootballBall className="text-base sm:text-lg" />
				{liveGames.length > 0 ? 'Other Games' : 'Games'}
				</h2>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
				{otherGames.map(game => (
					<GameCard key={game.id} game={game} />
				))}
				</div>
			</div>
			)}
		</>
		);
	})()}

	{/* No Games */}
	{!loading && games.length === 0 && !error && (
		<div className="text-center py-12 sm:py-16 md:py-20">
		<FaFootballBall className="text-4xl sm:text-5xl md:text-6xl text-[#faafe8] mx-auto mb-3 sm:mb-4" />
		<p className="text-[#e0e7ef] text-base sm:text-lg md:text-xl">No games scheduled at this time</p>
		</div>
	)}

	</div>
  );
};

export default NFLScoreboard;
