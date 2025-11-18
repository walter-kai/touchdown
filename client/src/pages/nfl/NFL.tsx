import React, { useState, useEffect } from "react";
import { FaFootballBall, FaPlay, FaClock, FaNewspaper, FaSync, FaUsers } from "react-icons/fa";
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
				<div className="grid grid-cols-1   gap-4 sm:gap-5 md:gap-6">
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
