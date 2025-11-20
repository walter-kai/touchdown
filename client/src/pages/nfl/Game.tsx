import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaFootballBall, FaTrophy, FaChartBar, FaMedkit } from 'react-icons/fa';
import axios from 'axios';
import HeadToHead from '@/components/nfl/HeadToHead';
import Prediction from '@/components/nfl/Prediction';
import Odds from '@/components/nfl/Odds';
import type { Event } from '@/types/espn/game';

interface NFLGameProps {
  activeTab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'odds';
  onTabChange: (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'odds') => void;
}

const NFLGame: React.FC<NFLGameProps> = ({ activeTab }) => {
  const { gameId } = useParams<{ gameId: string }>();
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`
        );

        setGameData(response.data);
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

  if (error || !gameData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1d2e] to-[#16182a] flex items-center justify-center pb-20">
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-8 text-center max-w-md">
          <p className="text-red-400 font-bold mb-2 text-lg">Error loading game</p>
          <p className="text-[#e0e7ef]">{error || 'Game not found'}</p>
        </div>
      </div>
    );
  }

  const { header, gameInfo, boxscore, leaders, injuries, broadcasts, pickcenter, lastFiveGames } = gameData;
  const competition = header?.competitions?.[0];
  const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
  const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1d2e] to-[#16182a] pb-24">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Box Score - Always visible at top */}
        <div className="bg-[#23263a]/90 border border-[#00ffe7]/30 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Away Team */}
            <div className="flex flex-col items-center">
              <img 
                src={awayTeam?.team?.logos?.[0]?.href} 
                alt={awayTeam?.team?.displayName}
                className="w-20 h-20 md:w-24 md:h-24 mb-3"
              />
              <h2 className="text-[#e0e7ef] font-bold text-base md:text-xl text-center truncate max-w-full px-2">{awayTeam?.team?.displayName}</h2>
              <p className="text-[#b0b7bf] text-sm">{awayTeam?.record?.[0]?.displayValue}</p>
              <p className="text-[#00ffe7] text-3xl md:text-4xl font-bold mt-2">{awayTeam?.score || '0'}</p>
            </div>

            {/* VS / Status */}
            <div className="text-center">
              <p className="text-[#faafe8] text-lg md:text-xl font-bold">{competition?.status?.type?.shortDetail}</p>
            </div>

            {/* Home Team */}
            <div className="flex flex-col items-center">
              <img 
                src={homeTeam?.team?.logos?.[0]?.href} 
                alt={homeTeam?.team?.displayName}
                className="w-20 h-20 md:w-24 md:h-24 mb-3"
              />
              <h2 className="text-[#e0e7ef] font-bold text-base md:text-xl text-center truncate max-w-full px-2">{homeTeam?.team?.displayName}</h2>
              <p className="text-[#b0b7bf] text-sm">{homeTeam?.record?.[0]?.displayValue}</p>
              <p className="text-[#faafe8] text-3xl md:text-4xl font-bold mt-2">{homeTeam?.score || '0'}</p>
            </div>
          </div>
        </div>

        {/* Info Tab - Game Overview */}
        {activeTab === 'info' && (
          <>
            {/* Game Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Venue & Weather */}
              {gameInfo && (
                <div className="bg-[#23263a]/90 border border-[#00ffe7]/30 rounded-lg p-4 relative overflow-hidden">
                  {/* Venue Background Image */}
                  {gameInfo.venue?.images?.[0]?.href && (
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-20"
                      style={{ backgroundImage: `url(${gameInfo.venue.images[0].href})` }}
                    />
                  )}
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <h4 className="text-[#00ffe7] font-semibold mb-2 text-sm">
                      {gameInfo.weather ? 'Venue & Weather' : 'Venue'}
                    </h4>
                    <p className="text-[#e0e7ef] font-bold text-sm">{gameInfo.venue?.fullName}</p>
                    <p className="text-[#b0b7bf] text-xs">
                      {gameInfo.venue?.address?.city}, {gameInfo.venue?.address?.state}
                    </p>
                    <p className="text-[#b0b7bf] text-xs">
                      {gameInfo.venue?.grass ? 'Natural Grass' : 'Artificial Turf'}
                    </p>
                    {gameInfo.weather && (
                      <div className="mt-2 pt-2 border-t border-[#00ffe7]/10">
                        <p className="text-[#e0e7ef] font-bold">{gameInfo.weather.temperature}°F</p>
                        <p className="text-[#b0b7bf] text-xs">
                          High: {gameInfo.weather.highTemperature}°F | Precip: {gameInfo.weather.precipitation}%
                        </p>
                        {gameInfo.weather.gust && (
                          <p className="text-[#b0b7bf] text-xs">Wind: {gameInfo.weather.gust} mph</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Betting Odds */}
              {pickcenter?.[0] && (
                <div className="bg-[#23263a]/90 border border-[#00ffe7]/30 rounded-lg p-4">
                  <h4 className="text-[#00ffe7] font-semibold mb-2 text-sm">Betting</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[#b0b7bf] text-xs">Spread:</span>
                      <span className="text-[#e0e7ef] font-bold text-sm">{pickcenter[0].details}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#b0b7bf] text-xs">O/U:</span>
                      <span className="text-[#e0e7ef] font-bold text-sm">{pickcenter[0].overUnder}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#b0b7bf] text-xs">ML ({awayTeam?.team?.abbreviation}):</span>
                      <span className="text-[#e0e7ef] font-bold text-sm">
                        {pickcenter[0].awayTeamOdds?.moneyLine > 0 ? '+' : ''}{pickcenter[0].awayTeamOdds?.moneyLine}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#b0b7bf] text-xs">ML ({homeTeam?.team?.abbreviation}):</span>
                      <span className="text-[#e0e7ef] font-bold text-sm">
                        {pickcenter[0].homeTeamOdds?.moneyLine > 0 ? '+' : ''}{pickcenter[0].homeTeamOdds?.moneyLine}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Broadcast Info */}
              {broadcasts && broadcasts.length > 0 && (
                <div className="bg-[#23263a]/90 border border-[#00ffe7]/30 rounded-lg p-4">
                  <h4 className="text-[#00ffe7] font-semibold mb-2 text-sm">How to Watch</h4>
                  <div className="space-y-2">
                    {broadcasts.map((broadcast: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-[#e0e7ef] font-bold text-sm">{broadcast.media.shortName}</span>
                        <span className="text-[#b0b7bf] text-xs">{broadcast.type.shortName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Last 5 Games */}
            {lastFiveGames && (
              <div className="grid grid-cols-2 gap-3 md:gap-6">
                {lastFiveGames.map((teamHistory: any) => (
                  <div key={teamHistory.team.id} className="bg-[#23263a]/90 border border-[#00ffe7]/30 rounded-xl p-3 md:p-6">
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                      <img src={teamHistory.team.logo} alt={teamHistory.team.displayName} className="w-8 h-8 md:w-12 md:h-12" />
                      <h3 className="text-[#00ffe7] font-bold text-xs md:text-lg">Last 5 - {teamHistory.team.displayName}</h3>
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      {teamHistory.events.map((game: any) => (
                        <div key={game.id} className="flex justify-between items-center bg-[#1a1d2e]/50 rounded-lg p-2 md:p-3">
                          <div className="flex items-center gap-1.5 md:gap-3 min-w-0 flex-1">
                            <img src={game.opponent.logo} alt={game.opponent.displayName} className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[#e0e7ef] font-bold text-xs md:text-sm truncate">
                                {game.atVs} {game.opponent.abbreviation}
                              </p>
                              <p className="text-[#b0b7bf] text-xs hidden md:block">
                                {new Date(game.gameDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`font-bold text-sm md:text-base ${game.gameResult === 'W' ? 'text-green-400' : 'text-red-400'}`}>
                              {game.gameResult}
                            </p>
                            <p className="text-[#b0b7bf] text-xs md:text-sm">{game.score}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Team Stats Tab */}
        {activeTab === 'team' && boxscore?.teams && (
          <div className="bg-[#23263a]/90 border border-[#00ffe7]/30 rounded-xl p-6">
            <h3 className="text-[#00ffe7] font-bold text-lg mb-4 flex items-center gap-2">
              <FaChartBar />
              Team Statistics
            </h3>
            <div className="space-y-4">
              {boxscore.teams[0].statistics.map((stat: any, idx: number) => {
                const homeStat = boxscore.teams.find((t: any) => t.homeAway === 'home')?.statistics[idx];
                const awayStat = boxscore.teams.find((t: any) => t.homeAway === 'away')?.statistics[idx];
                
                const awayValue = parseFloat(awayStat?.displayValue) || 0;
                const homeValue = parseFloat(homeStat?.displayValue) || 0;
                const total = awayValue + homeValue;
                const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;
                
                // Determine which team is winning this stat
                const awayWinning = awayValue > homeValue;
                const homeWinning = homeValue > awayValue;
                
                return (
                  <div key={`${stat.name}-${idx}`} className="border-b border-[#00ffe7]/10 pb-3">
                    <p className="text-[#b0b7bf] text-sm mb-2 text-center">{stat.label}</p>
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <p className="text-[#e0e7ef] font-bold text-right">{awayStat?.displayValue}</p>
                      <div className="relative h-2 bg-[#1a1d2e] rounded-full">
                        {/* Line indicator at the percentage point */}
                        <div 
                          className="absolute top-0 bottom-0 w-1 rounded-full transition-all" 
                          style={{ 
                            left: `${awayPercent}%`,
                            transform: 'translateX(-50%)',
                            backgroundColor: awayWinning ? '#00ffe7' : homeWinning ? '#faafe8' : '#6b7280'
                          }}
                        />
                      </div>
                      <p className="text-[#e0e7ef] font-bold text-left">{homeStat?.displayValue}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Player Leaders & Injuries Tab */}
        {activeTab === 'player' && (
          <>
            {/* Team Leaders */}
            {leaders && leaders.length === 2 && (
              <div className="bg-[#23263a]/90 border border-[#00ffe7]/30 rounded-xl p-3 md:p-6 mb-6">
                <h3 className="text-[#00ffe7] font-bold text-sm md:text-lg mb-2 text-center flex items-center justify-center gap-2">
                  <FaTrophy />
                  Team Leaders
                </h3>
                
                {/* Leaders by Category */}
                <div className="space-y-4 md:space-y-6">
                  {leaders[0].leaders.map((category: any, categoryIdx: number) => {
                    const awayLeaders = category.leaders;
                    const homeLeaders = leaders[1].leaders[categoryIdx]?.leaders || [];
                    const maxLength = Math.max(awayLeaders.length, homeLeaders.length);
                    
                    return (
                      <div key={category.name} className="border-b border-[#00ffe7]/10 pb-3 md:pb-4">
                        <p className="text-[#b0b7bf] text-xs md:text-sm mb-2 md:mb-3 text-center font-semibold">{category.displayName}</p>
                        <div className="space-y-2">
                          {Array.from({ length: maxLength }).map((_, idx) => {
                            const awayLeader = awayLeaders[idx];
                            const homeLeader = homeLeaders[idx];
                            
                            return (
                              <div key={`${category.name}-${idx}`} className="grid grid-cols-2 gap-2 md:gap-4 items-center">
                                {/* Away Team Leader - Right Aligned */}
                                {awayLeader ? (
                                  <div className="flex items-center justify-end gap-2 md:gap-3">
                                    <div className="text-right min-w-0 flex-1">
                                      <p className="text-[#e0e7ef] font-bold text-xs md:text-sm truncate">{awayLeader.athlete.displayName}</p>
                                      <p className="text-[#b0b7bf] text-xs">{awayLeader.displayValue}</p>
                                    </div>
                                    <img 
                                      src={awayLeader.athlete.headshot?.href} 
                                      alt={awayLeader.athlete.displayName}
                                      className="w-15 h-12 md:w-20 md:h-16 rounded-full flex-shrink-0"
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                  </div>
                                ) : (
                                  <div></div>
                                )}
                                
                                {/* Home Team Leader - Left Aligned */}
                                {homeLeader ? (
                                  <div className="flex items-center gap-2 md:gap-3">
                                    <img 
                                      src={homeLeader.athlete.headshot?.href} 
                                      alt={homeLeader.athlete.displayName}
                                      className="w-15 h-12 md:w-20 md:h-16 rounded-full flex-shrink-0"
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                    <div className="text-left min-w-0 flex-1">
                                      <p className="text-[#e0e7ef] font-bold text-xs md:text-sm truncate">{homeLeader.athlete.displayName}</p>
                                      <p className="text-[#b0b7bf] text-xs">{homeLeader.displayValue}</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div></div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Injuries */}
            {injuries && injuries.length > 0 && (
              <div className="bg-[#23263a]/90 border border-[#00ffe7]/30 rounded-xl p-3 md:p-6 mb-6">
                <h3 className="text-[#00ffe7] font-bold text-sm md:text-lg mb-3 md:mb-4 flex items-center gap-2">
                  <FaMedkit />
                  Injury Report
                </h3>
                <div className="grid grid-cols-2 gap-3 md:gap-6">
                  {injuries.map((teamInjuries: any) => (
                    <div key={teamInjuries.team.id}>
                      <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                        <img src={teamInjuries.team.logo} alt={teamInjuries.team.displayName} className="w-6 h-6 md:w-8 md:h-8" />
                        <h4 className="text-[#e0e7ef] font-bold text-xs md:text-base">{teamInjuries.team.displayName}</h4>
                      </div>
                      <div className="space-y-2">
                        {teamInjuries.injuries.map((injury: any) => (
                          <div key={injury.athlete.id} className="bg-[#1a1d2e]/50 rounded-lg p-2 md:p-3">
                            <div className="flex justify-between items-start gap-1">
                              <div className="min-w-0 flex-1">
                                <p className="text-[#e0e7ef] font-bold text-xs md:text-base truncate">{injury.athlete.displayName}</p>
                                <p className="text-[#b0b7bf] text-xs md:text-sm">{injury.athlete.position?.abbreviation}</p>
                              </div>
                              <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs font-bold whitespace-nowrap ${
                                injury.status === 'Out' ? 'bg-red-500/20 text-red-400' :
                                injury.status === 'Questionable' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {injury.status}
                              </span>
                            </div>
                            <p className="text-[#b0b7bf] text-xs md:text-sm mt-1">{injury.details?.type}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Head to Head Tab */}
        {activeTab === 'headtohead' && homeTeam && awayTeam && (
          <HeadToHead
            homeTeamId={homeTeam.id}
            awayTeamId={awayTeam.id}
            homeTeamName={homeTeam.team?.displayName || ''}
            awayTeamName={awayTeam.team?.displayName || ''}
          />
        )}

        {/* Predictions & Odds Tab */}
        {activeTab === 'prediction' && competition && (
          <Prediction
            gameId={gameId!}
            competitionId={competition.id}
            homeTeamInfo={{
              name: homeTeam?.team?.displayName || '',
              logo: homeTeam?.team?.logos?.[0]?.href || '',
              color: homeTeam?.team?.color || '00ffe7'
            }}
            awayTeamInfo={{
              name: awayTeam?.team?.displayName || '',
              logo: awayTeam?.team?.logos?.[0]?.href || '',
              color: awayTeam?.team?.color || 'faafe8'
            }}
          />
        )}
        
        {/* Odds Tab */}
        {activeTab === 'odds' && competition && (
          <Odds
            gameId={gameId!}
            competitionId={competition.id}
            gameStatus={competition.status.type.state}
            homeTeamInfo={{
              name: homeTeam?.team?.displayName || '',
              logo: homeTeam?.team?.logos?.[0]?.href || '',
              color: homeTeam?.team?.color || '00ffe7'
            }}
            awayTeamInfo={{
              name: awayTeam?.team?.displayName || '',
              logo: awayTeam?.team?.logos?.[0]?.href || '',
              color: awayTeam?.team?.color || 'faafe8'
            }}
          />
        )}

      </div>
    </div>
  );
};

export default NFLGame;
