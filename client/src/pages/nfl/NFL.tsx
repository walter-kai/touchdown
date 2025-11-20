import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaFootballBall, FaPlay, FaClock, FaNewspaper, FaCalendar, FaChevronLeft, FaChevronRight, FaTrophy, FaMapMarkerAlt } from "react-icons/fa";
import axios from "axios";
import type {
  Event,
  TeamOnBye,
  Article,
  Competitor
} from '@/types/espn/game';
import NewsCard from '@/components/nfl/NewsCard';

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
  events?: Event[]; // Direct events array from site API
  week?: {
    teamsOnBye?: TeamOnBye[];
    number?: number;
  };
}

const NFLScoreboard: React.FC = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Event[]>([]);
  const [news, setNews] = useState<Article[]>([]);
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
      
      const response = await axios.get(url);
      const data: ESPNData = response.data;
      
      // Get games from content.sbData.events or events
      const events = data.content?.sbData?.events || data.events || [];
      if (events) {
        console.log('Fetched games:', events.length);
        if (events.length > 0) {
          console.log('First game sample:', events[0]);
        }
        setGames(events);
      }
      
      if (data.news?.articles) {
        setNews(data.news.articles);
      }

      // Get week info from content.sbData.week or week
      const weekData = data.content?.sbData?.week || data.week;
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
	<div className="max-w-7xl mx-auto px-4 py-20">
	
	{/* Header */}
	<div className="mb-8 text-center">
		<div className="flex items-center justify-center gap-4 mb-5">
			<FaFootballBall className="text-4xl text-[#00ffe7] animate-pulse" />
			<h1 className="text-4xl md:text-5xl font-bold text-[#00ffe7]">
				NFL SCOREBOARD
			</h1>
			<FaFootballBall className="text-4xl text-[#00ffe7] animate-pulse" />
		</div>
		
		{/* Week Navigation */}
		<div className="flex items-center justify-center gap-4 mb-4">
			<button
				onClick={handlePreviousWeek}
				disabled={!selectedWeek || selectedWeek <= 1}
				className="p-3 bg-[#23263a] border border-[#00ffe7]/30 rounded-lg text-[#00ffe7] hover:bg-[#00ffe7]/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
			>
				<FaChevronLeft />
			</button>
			
			<div className="text-2xl font-bold text-white">
				Week {selectedWeek || weekNumber || '...'}
			</div>
			
			<button
				onClick={handleNextWeek}
				disabled={!selectedWeek || selectedWeek >= 18}
				className="p-3 bg-[#23263a] border border-[#00ffe7]/30 rounded-lg text-[#00ffe7] hover:bg-[#00ffe7]/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
			>
				<FaChevronRight />
			</button>
		</div>

		{lastUpdated && (
			<div className="text-sm text-gray-400">
				Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refresh in {countdown}s
			</div>
		)}
	</div>

	{/* News Section */}
	{news.length > 0 && (
		<div className="mb-8">
			<h2 className="text-2xl font-bold text-[#faafe8] mb-4 flex items-center gap-2">
				<FaNewspaper />
				Latest News
			</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{news.slice(0, 6).map((article, idx) => (
					<NewsCard key={idx} article={article} />
				))}
			</div>
		</div>
	)}

	{/* Teams on Bye */}
	{byeTeams.length > 0 && (
		<div className="mb-8 bg-[#181a23]/90 rounded-xl border border-[#faafe8]/30 p-4 shadow-[0_0_16px_rgba(250,175,232,0.1)]">
			<h3 className="text-lg font-bold text-[#faafe8] mb-3">Teams on Bye</h3>
			<div className="flex flex-wrap gap-3">
				{byeTeams.map((team) => (
					<button
						key={team.id}
						onClick={() => navigate(`/nfl/team/${team.id}`)}
						className="flex items-center gap-2 bg-[#23263a]/50 hover:bg-[#23263a] border border-[#faafe8]/20 hover:border-[#faafe8]/50 rounded-lg px-3 py-2 transition-all"
					>
						{team.logo && (
							<img src={team.logo} alt={team.displayName} className="w-6 h-6" />
						)}
						<span className="text-white text-sm font-semibold">{team.abbreviation}</span>
					</button>
				))}
			</div>
		</div>
	)}

	{/* Loading State */}
	{initialLoading && games.length === 0 && (
		<div className="text-center py-20">
		<FaClock className="text-6xl text-[#00ffe7] mx-auto mb-4 animate-pulse" />
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
	{!initialLoading && games.length > 0 && (() => {
		const liveGames = games.filter(game => game.status.type.state === 'in');
		const completedGames = games.filter(game => game.status.type.completed);
		const upcomingGames = games.filter(game => game.status.type.state === 'pre');
		
		return (
		<div className="space-y-8">
			{/* Live Games */}
			{liveGames.length > 0 && (
			<div>
				<h2 className="text-2xl font-bold text-[#00ffe7] mb-4 flex items-center gap-2">
				<FaPlay className="animate-pulse" />
				Live Now ({liveGames.length})
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{liveGames.map((game) => (
					<GameSummaryCard key={game.id} game={game} navigate={navigate} />
				))}
				</div>
			</div>
			)}
			
			{/* Completed Games */}
			{completedGames.length > 0 && (
			<div>
				<h2 className="text-2xl font-bold text-gray-400 mb-4 flex items-center gap-2">
				<FaTrophy />
				Final ({completedGames.length})
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{completedGames.map((game) => (
					<GameSummaryCard key={game.id} game={game} navigate={navigate} />
				))}
				</div>
			</div>
			)}
			
			{/* Upcoming Games */}
			{upcomingGames.length > 0 && (
			<div>
				<h2 className="text-2xl font-bold text-[#faafe8] mb-4 flex items-center gap-2">
				<FaCalendar />
				Upcoming ({upcomingGames.length})
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{upcomingGames.map((game) => (
					<GameSummaryCard key={game.id} game={game} navigate={navigate} />
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
  );
};

// Game Summary Card Component
interface GameSummaryCardProps {
  game: Event;
  navigate: (path: string) => void;
}

const GameSummaryCard: React.FC<GameSummaryCardProps> = ({ game, navigate }) => {
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
      <div className="text-center mb-3">
        {isPre && (
          <div className="text-sm text-gray-400">
            {new Date(game.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            <br />
            {new Date(game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        {isLive && (
          <div className="text-sm text-[#00ffe7] font-bold">
            Q{competition.status.period} - {competition.status.displayClock}
          </div>
        )}
        {isFinal && (
          <div className="text-sm text-gray-400 font-bold">FINAL</div>
        )}
      </div>

      {/* Teams */}
      <div className="space-y-3">
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
            {awayTeam.score || '-'}
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
            {homeTeam.score || '-'}
          </div>
        </div>
      </div>

      {/* Venue */}
      {competition.venue && (
        <div className="mt-3 pt-3 border-t border-[#faafe8]/20 flex items-center gap-2 text-xs text-gray-400">
          <FaMapMarkerAlt className="text-[#faafe8]" />
          <span className="truncate">{competition.venue.fullName}</span>
        </div>
      )}

      {/* Broadcast */}
      {competition.broadcast && (
        <div className="mt-2 text-xs text-[#faafe8]">
          📺 {competition.broadcast}
        </div>
      )}

      {/* Corner Accents */}
      <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00ffe7] rounded-tl-xl opacity-60" />
      <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00ffe7] rounded-tr-xl opacity-60" />
      <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00ffe7] rounded-bl-xl opacity-60" />
      <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00ffe7] rounded-br-xl opacity-60" />
    </button>
  );
};

export default NFLScoreboard;
