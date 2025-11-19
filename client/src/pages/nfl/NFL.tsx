import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaFootballBall, FaPlay, FaClock, FaNewspaper, FaSync, FaUsers, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import type {
  Event,
  TeamOnBye,
  Article
} from '@/types/espn/game';
import GameCard from '@/components/nfl/GameCard';
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
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch NFL data');
      }
      
      const data: ESPNData = await response.json();
      
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
		<div className="max-w-7xl mx-auto px-2 sm:px-4 py-16 sm:py-20">
	
	{/* Header */}
	<div className="mb-6 sm:mb-8 text-center">
		{/* Title Row */}
		<div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-5">
			<FaFootballBall className="text-2xl sm:text-3xl md:text-4xl text-[#00ffe7] animate-pulse" />
			<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#00ffe7] drop-shadow-[0_0_12px_#00ffe7] tracking-wide sm:tracking-widest">
				NFL SCOREBOARD
			</h1>
			<FaFootballBall className="text-2xl sm:text-3xl md:text-4xl text-[#00ffe7] animate-pulse" />
		</div>
		
		{/* Week Navigation Row */}
		<div className="flex items-center justify-center gap-3 sm:gap-4 mb-4">
			<button
				onClick={handlePreviousWeek}
				disabled={!selectedWeek || selectedWeek <= 1}
				className="p-2.5 sm:p-3 bg-[#00ffe7]/10 hover:bg-[#00ffe7]/20 border border-[#00ffe7]/40 rounded-lg text-[#00ffe7] transition-all hover:shadow-[0_0_8px_rgba(0,255,231,0.4)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none"
				title="Previous Week"
			>
				<FaChevronLeft className="text-base sm:text-lg" />
			</button>
			
			<div className="min-w-[120px] sm:min-w-[140px] px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-[#00ffe7]/20 via-[#00ffe7]/30 to-[#00ffe7]/20 border border-[#00ffe7]/50 rounded-lg shadow-[0_0_12px_rgba(0,255,231,0.3)]">
				<span className="text-lg sm:text-xl font-bold text-[#00ffe7] tracking-wider">
					WEEK {selectedWeek || weekNumber || '...'}
				</span>
			</div>
			
			<button
				onClick={handleNextWeek}
				disabled={!selectedWeek || selectedWeek >= 18}
				className="p-2.5 sm:p-3 bg-[#00ffe7]/10 hover:bg-[#00ffe7]/20 border border-[#00ffe7]/40 rounded-lg text-[#00ffe7] transition-all hover:shadow-[0_0_8px_rgba(0,255,231,0.4)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none"
				title="Next Week"
			>
				<FaChevronRight className="text-base sm:text-lg" />
			</button>
		</div>
		
		<div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
		{lastUpdated && (
			<span className="text-sm text-[#e0e7ef]">
			Last updated: {lastUpdated.toLocaleTimeString()}
			</span>
		)}
		<button
			onClick={handleManualRefresh}
			disabled={isRefreshing}
			className="flex items-center gap-2 px-4 py-2 bg-[#00ffe7]/20 border border-[#00ffe7]/30 rounded-lg text-[#00ffe7] hover:bg-[#00ffe7]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
		>
			<FaSync className={isRefreshing ? 'animate-spin' : ''} />
			{isRefreshing ? 'Refreshing...' : `Refresh (${countdown}s)`}
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
			<button 
				key={team.id} 
				onClick={() => navigate(`/nfl/team/${team.id}`)}
				className="flex items-center gap-1.5 sm:gap-2 bg-[#23263a]/50 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-lg border border-[#00ffe7]/20 hover:bg-[#00ffe7]/10 hover:border-[#00ffe7]/40 transition-all cursor-pointer"
			>
				<img 
				src={team.logo} 
				alt={team.displayName}
				className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 object-contain"
				/>
				<span className="text-xs sm:text-sm text-[#e0e7ef] font-medium">{team.displayName}</span>
			</button>
			))}
		</div>
		</div>
	)}

	{/* Loading State */}
	{initialLoading && games.length === 0 && (
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
	{!initialLoading && games.length > 0 && (() => {
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
				<div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6">
				{liveGames.map(game => (
					<GameCard key={game.id} event={game} />
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
					<GameCard key={game.id} event={game} />
				))}
				</div>
			</div>
			)}
		</>
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

export default NFLScoreboard;
