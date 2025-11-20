import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTv, FaMapMarkerAlt, FaCalendar, FaUsers, FaNewspaper, FaFootballBall, FaPlay, FaChevronDown, FaChevronUp, FaChartLine, FaPercent, FaDollarSign } from "react-icons/fa";
import HeadToHead from "./HeadToHead";
import Prediction from "./Prediction";
import Odds from "./Odds";
import type {
  Event,
  Competitor,
  Leader,
  Linescore
} from '@/types/espn/game';

// Helper function for status badge
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

interface GameCardProps {
  event: Event;
}

const GameCard: React.FC<GameCardProps> = ({ event }) => {
  const navigate = useNavigate();
  const [showGameLeaders, setShowGameLeaders] = useState(false);
  const [gameLeadersData, setGameLeadersData] = useState<{home: Leader[], away: Leader[]} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showPrediction, setShowPrediction] = useState(false);
  const [predictionData, setPredictionData] = useState<any>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  
  const [showOdds, setShowOdds] = useState(false);
  const [oddsData, setOddsData] = useState<any>(null);
  const [oddsLoading, setOddsLoading] = useState(false);
  const [oddsError, setOddsError] = useState<string | null>(null);
  
  const game = event;
  const competition = game.competitions[0];
  const awayTeam = competition.competitors.find((c: Competitor) => c.homeAway === 'away');
  const homeTeam = competition.competitors.find((c: Competitor) => c.homeAway === 'home');

  if (!awayTeam || !homeTeam) return null;

  // Handler to fetch game leaders from team API
  const fetchGameLeaders = async () => {
    // If already shown, just toggle visibility
    if (gameLeadersData) {
      setShowGameLeaders(!showGameLeaders);
      return;
    }

    // Just toggle visibility - component will fetch its own data
    setShowGameLeaders(!showGameLeaders);
  };

  // Handler to fetch prediction data
  const fetchPrediction = async () => {
    // Just toggle visibility - component will fetch its own data
    setShowPrediction(!showPrediction);
  };

  // Handler to fetch odds/probabilities data
  const fetchOdds = async () => {
    // Just toggle visibility - component will fetch its own data
    setShowOdds(!showOdds);
  };

  // Handler to navigate with leaders data
  const handleTeamClick = (teamId: string, leaders: any) => {
    navigate(`/nfl/team/${teamId}`, { state: { leaders } });
  };

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

              {/* Basic Info*/}
        <div className="p-2 grid grid-cols-3 gap-3 bg-gradient-to-r from-[#23263a]/50 via-[#181a23]/50 to-[#23263a]/50 rounded-xl border border-[#00ffe7]/20">
          {/* Venue */}
          {competition.venue && (
            <div className="justify-center flex items-start gap-2 p-2 bg-[#181a23]/50 rounded-lg">
              <FaMapMarkerAlt className="text-[#00ffe7] flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
            <div className="text-[10px] sm:text-xs text-gray-400">Where</div>
            <div className="text-xs sm:text-sm font-bold text-white truncate">{competition.venue.fullName}</div>
            <div className="text-[10px] text-gray-400">{competition.venue.address.city}, {competition.venue.address.state}</div>
              </div>
            </div>
          )}
          <div className="justify-center flex items-start gap-2 p-2 bg-[#181a23]/50 rounded-lg">
            <FaCalendar className="text-[#faafe8] flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] sm:text-xs text-gray-400">When</div>
              <div className="text-xs sm:text-sm font-bold text-white">
            {new Date(game.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="text-[10px] text-gray-400">
            {new Date(game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {competition.attendance >= 0 && (
            <div className="justify-center flex items-start gap-2 p-2 bg-[#181a23]/50 rounded-lg">
              <FaUsers className="text-[#faafe8] flex-shrink-0 mt-0.5" />
              <div>
            <div className="text-[10px] sm:text-xs text-gray-400">Attendance</div>
            <div className="text-xs sm:text-sm font-bold text-white">
              {competition.attendance === 0 ? 'TBD' : competition.attendance.toLocaleString()}
            </div>
              </div>
            </div>
          )}
        </div>
        {/* Weather */}
        {game.weather && (
        <div className="flex items-center justify-between gap-2 p-2 bg-[#181a23]/50 rounded-lg">
            <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🌤️</span>
            <div>
                <div className="text-[10px] sm:text-xs text-gray-400">Weather</div>
                <div className="text-xs sm:text-sm font-bold text-white">{game.weather.displayValue || game.weather.conditionId}</div>
            </div>
            </div>
            <div className="text-right flex-shrink-0">
            <div className="text-lg sm:text-xl font-bold text-[#00ffe7]">{game.weather.temperature}°F</div>
            <div className="text-[10px] sm:text-xs text-gray-400">High: {game.weather.highTemperature}°F</div>
            </div>
        </div>
        )}

      {/* Teams and Scores - Head to Head Matchup */}
      <div className="mb-3 sm:mb-4 p-4 sm:p-6 bg-gradient-to-r from-[#23263a]/50 via-[#181a23]/50 to-[#23263a]/50 rounded-xl border border-[#00ffe7]/20">
        <div className="flex items-center justify-between gap-4 sm:gap-6">
          
          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center text-center">
            <img 
              src={awayTeam.team.logo} 
              alt={awayTeam.team.displayName}
              className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain mb-2 sm:mb-3 cursor-pointer hover:scale-110 transition-transform duration-300"
              onClick={() => handleTeamClick(awayTeam.id, competition.leaders)}
            />
            <button
              onClick={() => handleTeamClick(awayTeam.id, competition.leaders)}
              className={`font-bold text-base sm:text-lg md:text-xl mb-1 hover:underline transition-colors ${awayTeam.winner ? 'text-[#00ffe7] hover:text-[#00ffe7]/80' : 'text-white hover:text-[#00ffe7]'}`}
            >
              {awayTeam.team.abbreviation}
            </button>
            <div className="text-xs sm:text-sm text-gray-400 mb-2">{awayRecord}</div>
            <div className={`text-4xl sm:text-5xl md:text-6xl font-bold ${awayTeam.winner ? 'text-[#00ffe7]' : 'text-white'}`}>
              {awayTeam.score}
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex flex-col items-center justify-center px-2 sm:px-4">
            <div className="text-xs sm:text-sm text-gray-400 mb-2">
              {getStatusBadge(game)}
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-[#faafe8] opacity-50">
              VS
            </div>
          </div>

          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center text-center">
            <img 
              src={homeTeam.team.logo} 
              alt={homeTeam.team.displayName}
              className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain mb-2 sm:mb-3 cursor-pointer hover:scale-110 transition-transform duration-300"
              onClick={() => handleTeamClick(homeTeam.id, competition.leaders)}
            />
            <button
              onClick={() => handleTeamClick(homeTeam.id, competition.leaders)}
              className={`font-bold text-base sm:text-lg md:text-xl mb-1 hover:underline transition-colors ${homeTeam.winner ? 'text-[#00ffe7] hover:text-[#00ffe7]/80' : 'text-white hover:text-[#00ffe7]'}`}
            >
              {homeTeam.team.abbreviation}
            </button>
            <div className="text-xs sm:text-sm text-gray-400 mb-2">{homeRecord}</div>
            <div className={`text-4xl sm:text-5xl md:text-6xl font-bold ${homeTeam.winner ? 'text-[#00ffe7]' : 'text-white'}`}>
              {homeTeam.score}
            </div>
          </div>

        </div>
      </div>

      {/* Game Information Panel */}
      <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-[#23263a]/50 rounded-lg border border-[#faafe8]/20 space-y-3 min-h-40">
        {/* Headlines */}
        {competition.headlines && competition.headlines.length > 0 && (
          <div className="p-2 bg-[#181a23]/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FaNewspaper className="text-[#faafe8] text-xs" />
              <div className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase">Headlines</div>
            </div>
            <div className="space-y-3">
              {competition.headlines.map((headline, idx) => (
                <div key={idx} className="space-y-1">
                  {headline.shortLinkText && (
                    <div className="text-xs sm:text-sm font-semibold text-[#00ffe7]">
                      {headline.shortLinkText}
                    </div>
                  )}
                  {headline.description && (
                    <div className="text-xs sm:text-sm text-[#e0e7ef] leading-relaxed">
                      {headline.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Odds */}
        {competition.odds && competition.odds.length > 0 && (
          <div className="p-2 bg-[#181a23]/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#faafe8] text-xs">📊</span>
              <div className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase">Betting Odds</div>
              <span className="text-[10px] text-gray-500">({competition.odds[0].provider.name})</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[10px] text-gray-400">Spread</div>
                <div className="text-xs sm:text-sm font-bold text-[#00ffe7]">
                  {competition.odds[0].spread > 0 ? '+' : ''}{competition.odds[0].spread}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400">O/U</div>
                <div className="text-xs sm:text-sm font-bold text-[#00ffe7]">
                  {competition.odds[0].overUnder}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400">Details</div>
                <div className="text-[10px] sm:text-xs text-[#e0e7ef] truncate">
                  {competition.odds[0].details}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    {/* Line Scores (Quarter by Quarter) */}
    {(awayTeam.linescores || homeTeam.linescores) && (
      <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-[#23263a]/50 rounded-lg overflow-x-auto">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs min-w-max">
        <div className="text-gray-400 font-bold">Team</div>
        <div className="text-gray-400 font-bold hidden sm:block">Q1</div>
        <div className="text-gray-400 font-bold hidden sm:block">Q2</div>
        <div className="text-gray-400 font-bold hidden sm:block">Q3</div>
        <div className="text-gray-400 font-bold hidden sm:block">Q4</div>
        <div className="text-gray-400 font-bold">T</div>
        
        <div className="text-[#e0e7ef]">{awayTeam.team.abbreviation}</div>
        {[...Array(4)].map((_, i) => {
          const ls = awayTeam.linescores?.[i];
          return (
            <div key={i} className="text-[#e0e7ef] hidden sm:block">
            {ls ? ls.displayValue : '-'}
            </div>
          );
        })}
        <div className="text-[#00ffe7] font-bold">{awayTeam.score}</div>
        
        <div className="text-[#e0e7ef]">{homeTeam.team.abbreviation}</div>
        {[...Array(4)].map((_, i) => {
          const ls = homeTeam.linescores?.[i];
          return (
            <div key={i} className="text-[#e0e7ef] hidden sm:block">
            {ls ? ls.displayValue : '-'}
            </div>
          );
        })}
        <div className="text-[#00ffe7] font-bold">{homeTeam.score}</div>
        </div>
      </div>
    )}

    {/* Season Leaders */}
      {competition.leaders && competition.leaders.length > 0 && (
        <div className="space-y-2 mb-3 sm:mb-4">
          <div className="text-[10px] sm:text-xs font-bold text-[#faafe8] uppercase tracking-wider">The Leaders</div>
          {competition.leaders.map((leader: Leader, idx: number) => {
            const topLeader = leader.leaders[0];
            return (
              <div 
                key={idx} 
                className="flex items-center gap-2 p-2 bg-[#23263a]/50 rounded-lg cursor-pointer hover:bg-[#23263a]/80 transition-all"
                onClick={() => navigate(`/nfl/player/${topLeader.athlete.id}`)}
              >
                <img 
                  src={topLeader.athlete.headshot} 
                  alt={topLeader.athlete.displayName}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0 hover:scale-110 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] sm:text-xs text-[#00ffe7] font-bold">{leader.displayName}</div>
                  <div className="text-xs sm:text-sm text-white truncate hover:text-[#00ffe7] transition-colors">{topLeader.athlete.displayName}</div>
                  <div className="text-[10px] sm:text-xs text-gray-400">{topLeader.displayValue}</div>
                </div>
              </div>
            );
          })}

          {/* Show Head to Head Button */}
          <button
            onClick={fetchGameLeaders}
            disabled={loading}
            className="w-full mt-3 py-2 px-4 bg-[#00ffe7]/10 hover:bg-[#00ffe7]/20 border border-[#00ffe7]/30 rounded-lg text-[#00ffe7] text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#00ffe7] border-t-transparent"></div>
                Loading...
              </>
            ) : (
              <>
                {showGameLeaders ? <FaChevronUp /> : <FaChevronDown />}
                {showGameLeaders ? 'Hide' : 'Show'} Head to Head
              </>
            )}
          </button>

          {/* Show Prediction Button */}
          <button
            onClick={fetchPrediction}
            disabled={predictionLoading}
            className="w-full mt-2 py-2 px-4 bg-[#faafe8]/10 hover:bg-[#faafe8]/20 border border-[#faafe8]/30 rounded-lg text-[#faafe8] text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {predictionLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#faafe8] border-t-transparent"></div>
                Loading...
              </>
            ) : (
              <>
                <FaPercent />
                {showPrediction ? 'Hide' : 'Show'} Prediction
              </>
            )}
          </button>

          {/* Show Odds Button - Only for live or completed games */}
          {(isLive || isFinal) && (
            <button
              onClick={fetchOdds}
              disabled={oddsLoading}
              className="w-full mt-2 py-2 px-4 bg-[#00ffe7]/10 hover:bg-[#00ffe7]/20 border border-[#00ffe7]/30 rounded-lg text-[#00ffe7] text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oddsLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#00ffe7] border-t-transparent"></div>
                  Loading...
                </>
              ) : (
                <>
                  <FaChartLine />
                  {showOdds ? 'Hide' : 'Show'} Live Odds
                </>
              )}
            </button>
          )}

          {/* Error Messages */}
          {error && (
            <div className="text-xs text-red-400 text-center mt-2">
              {error}
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
      )}

      {/* Game Leaders - Head to Head */}
      {showGameLeaders && gameLeadersData && (
        <div 
          className="overflow-hidden transition-all duration-500 ease-in-out"
          style={{
            maxHeight: showGameLeaders ? '2000px' : '0',
            opacity: showGameLeaders ? 1 : 0
          }}
        >
          <HeadToHead
            homeTeamId={homeTeam.id}
            awayTeamId={awayTeam.id}
            homeTeamName={homeTeam.team.displayName}
            awayTeamName={awayTeam.team.displayName}
          />
        </div>
      )}

      {/* Prediction */}
      {showPrediction && (
        <div 
          className="overflow-hidden transition-all duration-500 ease-in-out mt-4"
          style={{
            maxHeight: showPrediction ? '2000px' : '0',
            opacity: showPrediction ? 1 : 0
          }}
        >
          <Prediction
            gameId={game.id}
            competitionId={competition.id}
            homeTeamInfo={{
              name: homeTeam.team.displayName,
              logo: homeTeam.team.logo,
              color: homeTeam.team.color
            }}
            awayTeamInfo={{
              name: awayTeam.team.displayName,
              logo: awayTeam.team.logo,
              color: awayTeam.team.color
            }}
          />
        </div>
      )}

      {/* Odds */}
      {showOdds && (
        <div 
          className="overflow-hidden transition-all duration-500 ease-in-out mt-4"
          style={{
            maxHeight: showOdds ? '2000px' : '0',
            opacity: showOdds ? 1 : 0
          }}
        >
          <Odds
            gameId={game.id}
            competitionId={competition.id}
            gameStatus={competition.status.type.state}
            homeTeamInfo={{
              name: homeTeam.team.displayName,
              logo: homeTeam.team.logo,
              color: homeTeam.team.color
            }}
            awayTeamInfo={{
              name: awayTeam.team.displayName,
              logo: awayTeam.team.logo,
              color: awayTeam.team.color
            }}
          />
        </div>
      )}

      {/* Situation */}
      {competition.situation && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-r from-[#00ffe7]/10 to-[#faafe8]/10 rounded-lg border border-[#00ffe7]/30">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <FaFootballBall className={`text-sm sm:text-base text-[#00ffe7] ${isLive ? 'animate-bounce' : ''}`} />
              <span className="text-xs sm:text-sm font-bold text-[#00ffe7]">{isLive ? 'LIVE SITUATION' : 'GAME SITUATION'}</span>
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

      {/* Corner Accents */}
      <span className="absolute top-0 left-0 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border-t-2 border-l-2 border-[#00ffe7] rounded-tl-xl opacity-60" />
      <span className="absolute top-0 right-0 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border-t-2 border-r-2 border-[#00ffe7] rounded-tr-xl opacity-60" />
      <span className="absolute bottom-0 left-0 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border-b-2 border-l-2 border-[#00ffe7] rounded-bl-xl opacity-60" />
      <span className="absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border-b-2 border-r-2 border-[#00ffe7] rounded-br-xl opacity-60" />
    </div>
  );
};

GameCard.displayName = 'GameCard';

export default GameCard;
