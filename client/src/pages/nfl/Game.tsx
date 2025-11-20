import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaFootballBall, FaArrowLeft, FaTrophy, FaRunning, FaChartBar, FaMedkit, FaChevronDown, FaChevronUp, FaChartLine, FaPercent } from 'react-icons/fa';
import HeadToHead from '@/components/nfl/HeadToHead';
import Prediction from '@/components/nfl/Prediction';
import Odds from '@/components/nfl/Odds';
import type { Event } from '@/types/espn/game';

const NFLGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Head to Head state
  const [showHeadToHead, setShowHeadToHead] = useState(false);
  const [headToHeadData, setHeadToHeadData] = useState<{home: any[], away: any[]} | null>(null);
  const [headToHeadLoading, setHeadToHeadLoading] = useState(false);
  const [headToHeadError, setHeadToHeadError] = useState<string | null>(null);
  
  // Prediction state
  const [showPrediction, setShowPrediction] = useState(false);
  const [predictionData, setPredictionData] = useState<any>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  
  // Odds state
  const [showOdds, setShowOdds] = useState(false);
  const [oddsData, setOddsData] = useState<any>(null);
  const [oddsLoading, setOddsLoading] = useState(false);
  const [oddsError, setOddsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch game data');
        }

        const data = await response.json();
        
        // Store the entire response
        setGameData(data);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching game data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load game data');
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId]);

  // Fetch Head to Head data
  const fetchHeadToHead = async () => {
    if (headToHeadData) {
      setShowHeadToHead(!showHeadToHead);
      return;
    }

    const competition = gameData.header?.competitions?.[0];
    const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
    const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');

    if (!homeTeam || !awayTeam) return;

    setHeadToHeadLoading(true);
    setHeadToHeadError(null);

    try {
      const [homeRes, awayRes] = await Promise.all([
        fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${homeTeam.id}`),
        fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${awayTeam.id}`)
      ]);

      if (!homeRes.ok || !awayRes.ok) {
        throw new Error('Failed to fetch team data');
      }

      const [homeData, awayData] = await Promise.all([homeRes.json(), awayRes.json()]);

      const homeLeaders = homeData.team?.nextEvent?.[0]?.competitions?.[0]?.competitors?.find(
        (c: any) => c.id === homeTeam.id
      )?.leaders || [];

      const awayLeaders = awayData.team?.nextEvent?.[0]?.competitions?.[0]?.competitors?.find(
        (c: any) => c.id === awayTeam.id
      )?.leaders || [];

      setHeadToHeadData({ home: homeLeaders, away: awayLeaders });
      setShowHeadToHead(true);
    } catch (err) {
      console.error('Failed to fetch head to head data:', err);
      setHeadToHeadError('Failed to load head to head data.');
    } finally {
      setHeadToHeadLoading(false);
    }
  };

  // Fetch Prediction data
  const fetchPrediction = async () => {
    if (predictionData) {
      setShowPrediction(!showPrediction);
      return;
    }

    const competition = gameData.header?.competitions?.[0];
    if (!competition) return;

    setPredictionLoading(true);
    setPredictionError(null);

    try {
      const response = await fetch(
        `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/${gameId}/competitions/${competition.id}/predictor`
      );

      if (!response.ok) {
        throw new Error('Prediction data not available');
      }

      const data = await response.json();
      setPredictionData(data);
      setShowPrediction(true);
    } catch (err) {
      console.error('Failed to fetch prediction:', err);
      setPredictionError('Prediction data not available for this game.');
    } finally {
      setPredictionLoading(false);
    }
  };

  // Fetch Odds data
  const fetchOdds = async () => {
    if (oddsData) {
      setShowOdds(!showOdds);
      return;
    }

    const competition = gameData.header?.competitions?.[0];
    if (!competition) return;

    setOddsLoading(true);
    setOddsError(null);

    try {
      const response = await fetch(
        `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/${gameId}/competitions/${competition.id}/probabilities?limit=200`
      );

      if (!response.ok) {
        const status = competition.status.type.state;
        if (status === 'pre') {
          throw new Error('Odds data will be available once the game starts');
        }
        throw new Error('Failed to load odds data');
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        throw new Error('No probability data available for this game yet');
      }
      
      setOddsData(data);
      setShowOdds(true);
    } catch (err) {
      console.error('Failed to fetch odds:', err);
      setOddsError(err instanceof Error ? err.message : 'Live odds data not available for this game.');
    } finally {
      setOddsLoading(false);
    }
  };

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
      <div className="min-h-screen bg-gradient-to-b from-[#1a1d2e] to-[#16182a] flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-8 text-center max-w-md">
          <p className="text-red-400 font-bold mb-2 text-lg">Error loading game</p>
          <p className="text-[#e0e7ef] mb-4">{error || 'Game not found'}</p>
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

  const { header, gameInfo, boxscore, leaders, injuries, broadcasts, pickcenter, lastFiveGames } = gameData;
  const competition = header?.competitions?.[0];
  const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
  const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1d2e] to-[#16182a] pb-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/nfl')}
          className="flex items-center gap-2 px-4 py-2 mb-6 bg-[#23263a]/90 border border-[#00ffe7]/30 rounded-lg text-[#00ffe7] hover:bg-[#00ffe7]/10 transition-all"
        >
          <FaArrowLeft />
          Back to Scoreboard
        </button>

        {/* Game Header */}
        <div className="bg-[#23263a]/90 border border-[#00ffe7]/30 rounded-xl p-6 mb-6">
          <div className="text-center mb-4">
            <p className="text-[#00ffe7] font-bold text-sm mb-2">Week {header?.week}</p>
            <p className="text-[#e0e7ef] text-xl font-bold">
              {new Date(competition?.date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
            <p className="text-[#b0b7bf] mt-1">
              {new Date(competition?.date).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                timeZoneName: 'short'
              })}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Away Team */}
            <div className="text-center">
              <img 
                src={awayTeam?.team?.logos?.[0]?.href} 
                alt={awayTeam?.team?.displayName}
                className="w-24 h-24 mx-auto mb-3"
              />
              <h2 className="text-[#e0e7ef] font-bold text-xl">{awayTeam?.team?.displayName}</h2>
              <p className="text-[#b0b7bf]">{awayTeam?.record?.[0]?.displayValue}</p>
            </div>

            {/* VS */}
            <div className="text-center">
              <p className="text-[#00ffe7] text-3xl font-bold">{competition?.status?.type?.shortDetail}</p>
            </div>

            {/* Home Team */}
            <div className="text-center">
              <img 
                src={homeTeam?.team?.logos?.[0]?.href} 
                alt={homeTeam?.team?.displayName}
                className="w-24 h-24 mx-auto mb-3"
              />
              <h2 className="text-[#e0e7ef] font-bold text-xl">{homeTeam?.team?.displayName}</h2>
              <p className="text-[#b0b7bf]">{homeTeam?.record?.[0]?.displayValue}</p>
            </div>
          </div>
        </div>

        {/* Venue & Weather */}
        {gameInfo && (
          <div className="bg-[#23263a]/90 border border-[#00ffe7]/30 rounded-xl p-6 mb-6">
            <h3 className="text-[#00ffe7] font-bold text-lg mb-4 flex items-center gap-2">
              <FaFootballBall />
              Game Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-[#b0b7bf] text-sm">Venue</p>
                <p className="text-[#e0e7ef] font-bold">{gameInfo.venue?.fullName}</p>
                <p className="text-[#b0b7bf] text-sm">
                  {gameInfo.venue?.address?.city}, {gameInfo.venue?.address?.state}
                </p>
                <p className="text-[#b0b7bf] text-sm mt-1">
                  {gameInfo.venue?.grass ? 'Natural Grass' : 'Artificial Turf'}
                </p>
              </div>
              {gameInfo.weather && (
                <div>
                  <p className="text-[#b0b7bf] text-sm">Weather</p>
                  <p className="text-[#e0e7ef] font-bold text-2xl">{gameInfo.weather.temperature}°F</p>
                  <p className="text-[#b0b7bf] text-sm">
                    High: {gameInfo.weather.highTemperature}°F | Precipitation: {gameInfo.weather.precipitation}%
                  </p>
                  {gameInfo.weather.gust && (
                    <p className="text-[#b0b7bf] text-sm">Wind: {gameInfo.weather.gust} mph</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Betting Odds */}
        {pickcenter?.[0] && (
          <div className="bg-[#23263a]/90 border border-[#00ffe7]/30 rounded-xl p-6 mb-6">
            <h3 className="text-[#00ffe7] font-bold text-lg mb-4">Betting Information</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-[#b0b7bf] text-sm mb-2">Spread</p>
                <p className="text-[#e0e7ef] font-bold text-xl">{pickcenter[0].details}</p>
              </div>
              <div className="text-center">
                <p className="text-[#b0b7bf] text-sm mb-2">Over/Under</p>
                <p className="text-[#e0e7ef] font-bold text-xl">{pickcenter[0].overUnder}</p>
              </div>
              <div className="text-center">
                <p className="text-[#b0b7bf] text-sm mb-2">Moneyline</p>
                <div className="text-[#e0e7ef] font-bold">
                  <p>{awayTeam?.team?.abbreviation}: {pickcenter[0].awayTeamOdds?.moneyLine > 0 ? '+' : ''}{pickcenter[0].awayTeamOdds?.moneyLine}</p>
                  <p>{homeTeam?.team?.abbreviation}: {pickcenter[0].homeTeamOdds?.moneyLine > 0 ? '+' : ''}{pickcenter[0].homeTeamOdds?.moneyLine}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Statistics Comparison */}
        {boxscore?.teams && (
          <div className="bg-[#23263a]/90 border border-[#00ffe7]/30 rounded-xl p-6 mb-6">
            <h3 className="text-[#00ffe7] font-bold text-lg mb-4 flex items-center gap-2">
              <FaChartBar />
              Team Statistics
            </h3>
            <div className="space-y-4">
              {boxscore.teams[0].statistics.map((stat: any, idx: number) => {
                const homeStat = boxscore.teams.find((t: any) => t.homeAway === 'home')?.statistics[idx];
                const awayStat = boxscore.teams.find((t: any) => t.homeAway === 'away')?.statistics[idx];
                
                return (
                  <div key={`${stat.name}-${idx}`} className="border-b border-[#00ffe7]/10 pb-3">
                    <p className="text-[#b0b7bf] text-sm mb-2 text-center">{stat.label}</p>
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <p className="text-[#e0e7ef] font-bold text-right">{awayStat?.displayValue}</p>
                      <div className="h-2 bg-[#1a1d2e] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#00ffe7]" 
                          style={{ 
                            width: `${(parseFloat(awayStat?.displayValue) / (parseFloat(awayStat?.displayValue) + parseFloat(homeStat?.displayValue))) * 100}%` 
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

        {/* Team Leaders */}
        {leaders && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {leaders.map((teamLeaders: any) => (
              <div key={teamLeaders.team.id} className="bg-[#23263a]/90 border border-[#00ffe7]/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <img src={teamLeaders.team.logo} alt={teamLeaders.team.displayName} className="w-12 h-12" />
                  <h3 className="text-[#00ffe7] font-bold text-lg">{teamLeaders.team.displayName} Leaders</h3>
                </div>
                <div className="space-y-4">
                  {teamLeaders.leaders.map((category: any) => (
                    <div key={category.name} className="border-b border-[#00ffe7]/10 pb-3">
                      <p className="text-[#b0b7bf] text-sm mb-2">{category.displayName}</p>
                      {category.leaders.map((leader: any) => (
                        <div key={leader.athlete.id} className="flex items-center gap-3">
                          <img 
                            src={leader.athlete.headshot?.href} 
                            alt={leader.athlete.displayName}
                            className="w-10 h-10 rounded-full"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <div className="flex-1">
                            <p className="text-[#e0e7ef] font-bold">{leader.athlete.displayName}</p>
                            <p className="text-[#b0b7bf] text-sm">{leader.displayValue}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Injuries */}
        {injuries && injuries.length > 0 && (
          <div className="bg-[#23263a]/90 border border-[#00ffe7]/30 rounded-xl p-6 mb-6">
            <h3 className="text-[#00ffe7] font-bold text-lg mb-4 flex items-center gap-2">
              <FaMedkit />
              Injury Report
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {injuries.map((teamInjuries: any) => (
                <div key={teamInjuries.team.id}>
                  <div className="flex items-center gap-3 mb-3">
                    <img src={teamInjuries.team.logo} alt={teamInjuries.team.displayName} className="w-8 h-8" />
                    <h4 className="text-[#e0e7ef] font-bold">{teamInjuries.team.displayName}</h4>
                  </div>
                  <div className="space-y-2">
                    {teamInjuries.injuries.map((injury: any) => (
                      <div key={injury.athlete.id} className="bg-[#1a1d2e]/50 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[#e0e7ef] font-bold">{injury.athlete.displayName}</p>
                            <p className="text-[#b0b7bf] text-sm">{injury.athlete.position?.abbreviation}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            injury.status === 'Out' ? 'bg-red-500/20 text-red-400' :
                            injury.status === 'Questionable' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {injury.status}
                          </span>
                        </div>
                        <p className="text-[#b0b7bf] text-sm mt-1">{injury.details?.type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last 5 Games */}
        {lastFiveGames && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {lastFiveGames.map((teamHistory: any) => (
              <div key={teamHistory.team.id} className="bg-[#23263a]/90 border border-[#00ffe7]/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <img src={teamHistory.team.logo} alt={teamHistory.team.displayName} className="w-12 h-12" />
                  <h3 className="text-[#00ffe7] font-bold text-lg">Last 5 Games - {teamHistory.team.displayName}</h3>
                </div>
                <div className="space-y-3">
                  {teamHistory.events.map((game: any) => (
                    <div key={game.id} className="flex justify-between items-center bg-[#1a1d2e]/50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <img src={game.opponent.logo} alt={game.opponent.displayName} className="w-8 h-8" />
                        <div>
                          <p className="text-[#e0e7ef] font-bold text-sm">
                            {game.atVs} {game.opponent.abbreviation}
                          </p>
                          <p className="text-[#b0b7bf] text-xs">
                            {new Date(game.gameDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${game.gameResult === 'W' ? 'text-green-400' : 'text-red-400'}`}>
                          {game.gameResult}
                        </p>
                        <p className="text-[#b0b7bf] text-sm">{game.score}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Broadcast Info */}
        {broadcasts && broadcasts.length > 0 && (
          <div className="bg-[#23263a]/90 border border-[#00ffe7]/30 rounded-xl p-6 mb-6">
            <h3 className="text-[#00ffe7] font-bold text-lg mb-4">How to Watch</h3>
            <div className="flex flex-wrap gap-4">
              {broadcasts.map((broadcast: any, idx: number) => (
                <div key={idx} className="bg-[#1a1d2e]/50 rounded-lg px-4 py-2">
                  <p className="text-[#e0e7ef] font-bold">{broadcast.media.shortName}</p>
                  <p className="text-[#b0b7bf] text-sm">{broadcast.type.shortName}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Buttons */}
        <div className="bg-[#23263a]/90 border border-[#00ffe7]/30 rounded-xl p-6 mb-6 space-y-3">
          <h3 className="text-[#00ffe7] font-bold text-lg mb-4">Game Analysis</h3>
          
          {/* Head to Head Button */}
          <button
            onClick={fetchHeadToHead}
            disabled={headToHeadLoading}
            className="w-full py-3 px-4 bg-[#00ffe7]/10 hover:bg-[#00ffe7]/20 border border-[#00ffe7]/30 rounded-lg text-[#00ffe7] text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {headToHeadLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#00ffe7] border-t-transparent"></div>
                Loading...
              </>
            ) : (
              <>
                {showHeadToHead ? <FaChevronUp /> : <FaChevronDown />}
                {showHeadToHead ? 'Hide' : 'Show'} Head to Head Comparison
              </>
            )}
          </button>

          {/* Prediction Button */}
          <button
            onClick={fetchPrediction}
            disabled={predictionLoading}
            className="w-full py-3 px-4 bg-[#faafe8]/10 hover:bg-[#faafe8]/20 border border-[#faafe8]/30 rounded-lg text-[#faafe8] text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {predictionLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#faafe8] border-t-transparent"></div>
                Loading...
              </>
            ) : (
              <>
                <FaPercent />
                {showPrediction ? 'Hide' : 'Show'} Win Prediction
              </>
            )}
          </button>

          {/* Odds Button */}
          {(homeTeam && awayTeam) && (
            <button
              onClick={fetchOdds}
              disabled={oddsLoading}
              className="w-full py-3 px-4 bg-[#00ffe7]/10 hover:bg-[#00ffe7]/20 border border-[#00ffe7]/30 rounded-lg text-[#00ffe7] text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oddsLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#00ffe7] border-t-transparent"></div>
                  Loading...
                </>
              ) : (
                <>
                  <FaChartLine />
                  {showOdds ? 'Hide' : 'Show'} Live Win Probability
                </>
              )}
            </button>
          )}

          {/* Error Messages */}
          {headToHeadError && (
            <div className="text-xs text-red-400 text-center mt-2">
              {headToHeadError}
            </div>
          )}
          {predictionError && (
            <div className="text-xs text-red-400 text-center mt-2">
              {predictionError}
            </div>
          )}
          {oddsError && (
            <div className="text-xs text-red-400 text-center mt-2">
              {oddsError}
            </div>
          )}
        </div>

        {/* Head to Head Component */}
        {showHeadToHead && headToHeadData && (
          <div className="overflow-hidden transition-all duration-500 ease-in-out mb-6">
            <HeadToHead
              homeTeamLeaders={headToHeadData.home}
              awayTeamLeaders={headToHeadData.away}
              homeTeamName={homeTeam?.team?.displayName || ''}
              awayTeamName={awayTeam?.team?.displayName || ''}
            />
          </div>
        )}

        {/* Prediction Component */}
        {showPrediction && predictionData && (
          <div className="overflow-hidden transition-all duration-500 ease-in-out mb-6">
            <Prediction
              data={predictionData}
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
              onClose={() => setShowPrediction(false)}
            />
          </div>
        )}

        {/* Odds Component */}
        {showOdds && oddsData && (
          <div className="overflow-hidden transition-all duration-500 ease-in-out mb-6">
            <Odds
              data={oddsData}
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
              onClose={() => setShowOdds(false)}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default NFLGame;
