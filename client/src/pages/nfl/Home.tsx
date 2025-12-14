import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaFootballBall, FaPlay, FaNewspaper, FaCalendar, FaChevronLeft, FaChevronRight, FaTrophy, FaMapMarkerAlt } from "react-icons/fa";
import axios from "axios";
import LoadingFootball from '../../components/common/LoadingFootball';
import NewsTicker from '../../components/nfl/NewsTicker';
import type {
  Event,
  TeamOnBye,
  ScoreboardResponse,
  Competitor
} from '@/types/espn/scoreboard';
import type { NewsArticle } from '@/types/espn/news';

// Removed AuthDebug banner per design request

interface ESPNData extends ScoreboardResponse {
  news?: {
    articles?: NewsArticle[];
  };
}

const NFLScoreboard: React.FC = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Event[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [byeTeams, setByeTeams] = useState<TeamOnBye[]>([]);
  const [weekNumber, setWeekNumber] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null); // Week to display
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(30);

  // Helper function to get date range for a specific NFL week
  // NFL weeks start on Thursday and end on Wednesday (7 days)
  // Week 1 of 2024 season started on Sept 5, 2024
  const getWeekDateRange = (week: number): string => {
    // 2024 NFL Season: Week 1 started on Thursday, Sept 5, 2024
    const season2025Week1Start = new Date('2025-09-04');
    
    // Calculate the start date for the requested week
    const daysOffset = (week - 1) * 7;
    const weekStart = new Date(season2025Week1Start);
    weekStart.setDate(weekStart.getDate() + daysOffset);
    
    // Week ends 6 days later (Thursday to Wednesday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // Format as YYYYMMDD
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };
    
    return `${formatDate(weekStart)}-${formatDate(weekEnd)}`;
  };

  const fetchNFLData = async (isInitial = false, week?: number) => {
    try {
      if (isInitial) {
        setInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      
      // Build URL with optional week parameter
      let url = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?limit=50';
      if (week) {
        const dateRange = getWeekDateRange(week);
        url += `&dates=${dateRange}`;
      }
      
      // Fetch scoreboard and news in parallel
      const [scoreboardResponse, newsResponse] = await Promise.all([
        axios.get(url),
        axios.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=6')
      ]);
      
      const data: ESPNData = scoreboardResponse.data;
      
      // Get games from events array
      const events = data.events || [];
      if (events) {
        console.log('Fetched games:', events.length);
        if (events.length > 0) {
          console.log('First game sample:', events[0]);
        }
        setGames(events);
      }
      
      // Set news from dedicated news endpoint
      if (newsResponse.data?.articles) {
        setNews(newsResponse.data.articles);
      }

      // Get week info from week property
      const weekData = data.week;
      if (weekData) {
        setByeTeams(weekData.teamsOnBye || []);
        const currentWeek = weekData.number || null;
        setWeekNumber(currentWeek);
        
        // Set selected week if not already set
        if (!selectedWeek && currentWeek) {
          setSelectedWeek(currentWeek);
        }
      }
      
      setLastUpdated(new Date());
      setCountdown(30); // Reset countdown to 30 seconds
      setInitialLoading(false);
      setIsRefreshing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setInitialLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchNFLData(false, selectedWeek || undefined);
  };

  const handlePreviousWeek = () => {
    if (selectedWeek && selectedWeek > 1) {
      const newWeek = selectedWeek - 1;
      setSelectedWeek(newWeek);
      fetchNFLData(false, newWeek);
    }
  };

  const handleNextWeek = () => {
    if (selectedWeek && selectedWeek < 18) { // Regular season is 18 weeks
      const newWeek = selectedWeek + 1;
      setSelectedWeek(newWeek);
      fetchNFLData(false, newWeek);
    }
  };

  useEffect(() => {
    fetchNFLData(true);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (countdown <= 0) {
      fetchNFLData(false, selectedWeek || undefined);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, selectedWeek]);

  return (
  <>
  <div className="max-w-7xl mx-auto py-2">
	
  {/* Week Navigation */}
		<div className="bg-[#181a23]/50 rounded-lg p-4 border border-[#faafe8]/30 mb-6">
          {lastUpdated && (
        // <div className="bg-[#181a23]/50 rounded-lg p-3 border border-[#faafe8]/20 mb-6">
          <p className="text-sm text-gray-400 text-center mb-2">
            Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refresh in {countdown}s
          </p>
        // </div>
      )}
			<div className="flex items-center justify-between gap-4">
				<button
					onClick={handlePreviousWeek}
					disabled={!selectedWeek || selectedWeek <= 1}
					className="btn-purple flex items-center gap-2 h-12 w-48"
				>
					<FaChevronLeft />
					Last
				</button>
				
				<h1 className="w-full text-center pt-2 mx-2">
					Week {selectedWeek || weekNumber || '...'}
				</h1>
				
				<button
					onClick={handleNextWeek}
					disabled={!selectedWeek || selectedWeek >= 18}
					className="btn-purple flex items-center gap-2 h-12 w-48"
				>
					Next
					<FaChevronRight />
				</button>
			</div>

		</div>


  {/* Teams on Bye - Ticker Banner */}
  {byeTeams.length > 0 && (
    <div className="mb-6 bg-[#181a23]/90 rounded-lg border border-[#faafe8]/30 overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-2">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-bold text-[#faafe8]">TEAMS ON BYE:</span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1">
          {byeTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => navigate(`/nfl/team/${team.id}`)}
              className="flex items-center gap-2 bg-[#23263a]/50 hover:bg-[#23263a] border border-[#faafe8]/20 hover:border-[#faafe8]/50 rounded px-3 py-1 transition-all flex-shrink-0"
            >
              {team.logo && <img src={team.logo} alt={team.displayName} className="w-5 h-5" />}
              <span className="text-white text-xs font-semibold">{team.abbreviation}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )}

  {/* News Ticker - Moved to Top */}
  <NewsTicker news={news} />

  {/* Loading State */}
	{initialLoading && games.length === 0 && <LoadingFootball message="Loading NFL scores..." />}

  {/* Error State */}
	{error && (
		<div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 sm:p-5 md:p-6 text-center">
		<p className="text-red-400 font-bold mb-2 text-sm sm:text-base">Error loading data</p>
		<p className="text-[#e0e7ef] text-xs sm:text-sm">{error}</p>
		</div>
	)}

  {/* Games Grid */}
	{!initialLoading && games.length > 0 && (() => {
		const liveGames = games.filter(game => game.status.type.state === 'in');
		const completedGames = games.filter(game => game.status.type.completed);
		const upcomingGames = games.filter(game => game.status.type.state === 'pre');
		
		return (
		<div className="space-y-8">
			{/* Live Games */}
			{liveGames.length > 0 && (
			<div>
				<h1 className="flex items-center gap-2 mx-2">
				Live Now ({liveGames.length})
				</h1>
				<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 px-2">
				{liveGames.map((game) => (
					<GameGridCard key={game.id} game={game} navigate={navigate} />
				))}
				</div>
			</div>
			)}

      {/* Upcoming Games */}
			{upcomingGames.length > 0 && (
			<div>
				<h1 className="flex items-center gap-2">
				<FaCalendar />
				Upcoming ({upcomingGames.length})
				</h1>
				<div className={`px-2 grid gap-4 ${upcomingGames.length === 1 ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
				{upcomingGames.map((game) => (
					<GameGridCard key={game.id} game={game} navigate={navigate} />
				))}
				</div>
			</div>
			)}
			
			{/* Completed Games */}
			{completedGames.length > 0 && (
			<div>
				<h1 className="flex items-center gap-2">
				<FaTrophy />
				Final ({completedGames.length})
				</h1>
				<div className={`px-2 grid gap-4 ${completedGames.length === 1 ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
				{completedGames.map((game) => (
					<GameGridCard key={game.id} game={game} navigate={navigate} />
				))}
				</div>
			</div>
			)}
			
		</div>
		);
	})()}

  {/* No Games */}
	{!initialLoading && games.length === 0 && !error && (
		<div className="text-center py-12 sm:py-16 md:py-20">
		<FaFootballBall className="text-4xl sm:text-5xl md:text-6xl text-[#faafe8] mx-auto mb-3 sm:mb-4" />
		<p className="text-[#e0e7ef] text-base sm:text-lg md:text-xl">No games scheduled at this time</p>
		</div>
	)}

  </div>
  </>
  );
};

// Game Grid Card Component
interface GameGridCardProps {
  game: Event;
  navigate: (path: string) => void;
}

const GameGridCard: React.FC<GameGridCardProps> = ({ game, navigate }) => {
  const competition = game.competitions[0];
  const awayTeam = competition.competitors.find((c: Competitor) => c.homeAway === 'away');
  const homeTeam = competition.competitors.find((c: Competitor) => c.homeAway === 'home');
  
  if (!awayTeam || !homeTeam) return null;

  const isLive = competition.status.type.state === 'in';
  const isFinal = competition.status.type.completed;
  const isPre = competition.status.type.state === 'pre';

  return (
    <button
      onClick={() => navigate(`/nfl/game/${game.id}`)}
      className="relative bg-[#181a23]/90 rounded-xl border border-[#00ffe7]/30 shadow-[0_0_20px_rgba(0,255,231,0.1)] p-4 hover:border-[#00ffe7]/50 hover:shadow-[0_0_30px_rgba(0,255,231,0.2)] transition-all duration-300 text-left w-full"
    >
      {/* Live Badge */}
      {isLive && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-[#00ffe7]/20 border border-[#00ffe7]/50 rounded-full">
          <FaPlay className="text-[10px] text-[#00ffe7] animate-pulse" />
          <span className="text-xs font-bold text-[#00ffe7]">LIVE</span>
        </div>
      )}

      {/* Game Time/Status */}
      {isLive && (
        <div className="text-center mb-3">
          <div className="text-sm text-[#00ffe7] font-bold">
            Q{competition.status.period} - {competition.status.displayClock}
          </div>
        </div>
      )}

      {/* Teams */}
      <div className={`space-y-3 ${!isLive ? 'mt-3' : ''}`}>
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <img 
              src={awayTeam.team.logo} 
              alt={awayTeam.team.displayName}
              className="w-10 h-10 object-contain"
            />
            <div>
              <div className={`font-bold ${awayTeam.winner ? 'text-[#00ffe7]' : 'text-white'}`}>
                {awayTeam.team.abbreviation}
              </div>
              <div className="text-xs text-gray-400">
                {awayTeam.records?.find((r: any) => r.type === 'total')?.summary || ''}
              </div>
            </div>
          </div>
          <div className={`text-2xl font-bold ${awayTeam.winner ? 'text-[#00ffe7]' : 'text-white'}`}>
            {awayTeam.score || '0'}
          </div>
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <img 
              src={homeTeam.team.logo} 
              alt={homeTeam.team.displayName}
              className="w-10 h-10 object-contain"
            />
            <div>
              <div className={`font-bold ${homeTeam.winner ? 'text-[#00ffe7]' : 'text-white'}`}>
                {homeTeam.team.abbreviation}
              </div>
              <div className="text-xs text-gray-400">
                {homeTeam.records?.find((r: any) => r.type === 'total')?.summary || ''}
              </div>
            </div>
          </div>
          <div className={`text-2xl font-bold ${homeTeam.winner ? 'text-[#00ffe7]' : 'text-white'}`}>
            {homeTeam.score || '0'}
          </div>
        </div>
      </div>

      {/* Date/Time and Venue/Broadcast Info */}
      <div className="mt-3 pt-3 border-t border-[#faafe8]/20 flex items-start justify-between gap-4 text-xs">
        {/* Left: Date & Time */}
        <div className="text-gray-400 flex-shrink-0">
          <div className="whitespace-nowrap">{new Date(game.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          <div className="whitespace-nowrap">{new Date(game.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
        </div>

        {/* Right: Venue & Broadcast */}
        <div className="text-right text-gray-400 flex-1 min-w-0">
          {competition.venue && (
            <div className="flex items-center justify-end gap-1 mb-1">
              <FaMapMarkerAlt className="text-[#faafe8] flex-shrink-0" />
              <span className="truncate">{competition.venue.fullName}</span>
            </div>
          )}
          {competition.broadcasts && competition.broadcasts.length > 0 && (
            <div className="text-[#faafe8] truncate">
              📺 {competition.broadcasts[0].names.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Corner Accents */}
      <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00ffe7] rounded-tl-xl opacity-60" />
      <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00ffe7] rounded-tr-xl opacity-60" />
      <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00ffe7] rounded-bl-xl opacity-60" />
      <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00ffe7] rounded-br-xl opacity-60" />
    </button>
  );
};

export default NFLScoreboard;
