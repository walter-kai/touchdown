import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaFootballBall, FaPlay, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import LoadingFootball from '../../../components/common/LoadingFootball';
import NewsTicker from '../../../components/espn/NewsTicker';
import WeekNav from '../../../components/common/navs/WeekNav';
import { useLeague } from '../../../providers/LeagueContext';
import { getScoreboardUrl, getNewsUrl } from '@/utils/espnApi';
import type {
  Event,
  Competitor,
  TeamOnBye
} from '@/types/espn/scoreboard';
import type { NewsArticle } from '@/types/espn/news';

interface ESPNData {
  events?: Event[];
  week?: {
    number?: number;
    teamsOnBye?: TeamOnBye[];
  };
  news?: {
    articles?: NewsArticle[];
  };
}

const GameGrid: React.FC = () => {
  const navigate = useNavigate();
  const { league } = useLeague();
  const [games, setGames] = useState<Event[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [byeTeams, setByeTeams] = useState<TeamOnBye[]>([]);
  const [weekNumber, setWeekNumber] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get date range for a specific NFL week
  const getWeekDateRange = (week: number): string => {
    // 2025 NFL Season: Week 1 started on Thursday, Sept 4, 2025
    const season2025Week1Start = new Date('2025-09-04');
    const daysOffset = (week - 1) * 7;
    const weekStart = new Date(season2025Week1Start);
    weekStart.setDate(weekStart.getDate() + daysOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };
    return `${formatDate(weekStart)}-${formatDate(weekEnd)}`;
  };

  const fetchScoreboardData = useCallback(async (week?: number, date?: string) => {
    try {
      setError(null);
      setInitialLoading(true);

      console.log('Fetching games for:', { league, week, date });
      
      // Determine dates parameter
      let datesParam: string | undefined;
      if (date) {
        datesParam = date; // Can be single date or range
      } else if (week) {
        datesParam = getWeekDateRange(week);
      }
      
      // Use centralized API utility - both NFL and NBA support date ranges
      const url = getScoreboardUrl(league, {
        dates: datesParam,
        limit: datesParam ? 100 : 50
      });

      console.log('Fetching URL:', url);

      // Fetch scoreboard and news
      const requests = [
        axios.get(url),
        axios.get(getNewsUrl(league))
      ];
      const responses = await Promise.all(requests);
      const scoreboardResponse = responses[0];
      const newsResponse = responses[1];

      // NBA and NFL have different response structures
      // Note: site.api.espn.com/nba has events at root level (like NFL)
      // This is different from cdn.espn.com/nba which nests in content.sbData
      const data: ESPNData = scoreboardResponse.data;

      // Set news
      if (newsResponse?.data?.articles) {
        setNews(newsResponse.data.articles);
      } else {
        setNews([]);
      }

      const events = data.events || [];
      console.log('Games fetched:', events.length);
      setGames(events);

      const weekData = data.week;
      if (weekData) {
        setByeTeams(weekData.teamsOnBye || []);
        const currentWeek = weekData.number || null;
        setWeekNumber(currentWeek);
        if (!week && !date) {
          setSelectedWeek(currentWeek);
        }
      }

      setInitialLoading(false);
    } catch (err) {
      console.error('Error fetching games:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setInitialLoading(false);
    }
  }, [league]);

  const handlePreviousWeek = useCallback(() => {
    if (selectedWeek && selectedWeek > 1) {
      setSelectedWeek(selectedWeek - 1);
      setSelectedDate(null);
    }
  }, [selectedWeek]);

  const handleNextWeek = useCallback(() => {
    if (selectedWeek && selectedWeek < 18) {
      setSelectedWeek(selectedWeek + 1);
      setSelectedDate(null);
    }
  }, [selectedWeek]);

  const handleDateSelect = useCallback((dateOrRange: string) => {
    console.log('Date selected:', dateOrRange);
    setSelectedDate(dateOrRange);
    setSelectedWeek(null); // Clear week selection when date is selected
  }, []);

  // Refresh scoreboard whenever this view is (re)loaded
  useEffect(() => {
    // Don't fetch on initial mount - wait for WeekNav to set the date/week
    // This prevents showing previous games before switching to upcoming games
    if (selectedWeek === null && selectedDate === null && initialLoading) {
      console.log('Waiting for WeekNav to set date/week...');
      return;
    }
    
    console.log('Effect triggered - fetching with:', { selectedWeek, selectedDate });
    fetchScoreboardData(selectedWeek || undefined, selectedDate || undefined);
  }, [fetchScoreboardData, selectedWeek, selectedDate]);

  // Helper function to group games by date with time information preserved
  const groupGamesByDate = (gamesList: Event[]) => {
    const grouped = gamesList.reduce((acc, game) => {
      const dateKey = new Date(game.date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      
      // Add time to each game object
      const timeKey = new Date(game.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      acc[dateKey].push({ ...game, timeKey });
      
      return acc;
    }, {} as Record<string, Array<Event & { timeKey: string }>>);
    
    return grouped;
  };

  // Categorize and sort games
  const { liveGames, completedGames, upcomingGames } = useMemo(() => {
    const live = games.filter(game => game.status.type.state === 'in');
    const completed = games
      .filter(game => game.status.type.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date descending (most recent first)
    const upcoming = games.filter(game => game.status.type.state === 'pre');
    
    return { liveGames: live, completedGames: completed, upcomingGames: upcoming };
  }, [games]);

  return (
  <>
  <div className="max-w-7xl mx-auto py-2">
	
    {/* News Ticker - Moved to Top */}
  <NewsTicker news={news} />
  {/* Week Navigation - New Calendar Style */}
  <WeekNav 
    onDateSelect={handleDateSelect}
    selectedDate={selectedDate || undefined}
  />


  {/* Teams on Bye - Ticker Banner */}
  {/* {byeTeams.length > 0 && (
    <div className="mb-6 bg-bg-dark/90 rounded-lg border border-neon-pink/30 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-bold text-neon-pink">TEAMS ON BYE:</span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1">
          {byeTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => navigate(`/${league}/team/${team.id}`)}
              className="flex items-center gap-2 bg-bg-darker/50 hover:bg-bg-darker border border-neon-pink/20 hover:border-neon-pink/50 rounded px-3 py-1 transition-all flex-shrink-0"
            >
              {team.logo && <img src={team.logo} alt={team.displayName} className="w-5 h-5" />}
              <span className="text-white text-xs font-semibold">{team.abbreviation}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )} */}

  {/* Loading State */}
	{initialLoading && games.length === 0 && <LoadingFootball message="Loading NFL scores..." />}

  {/* Error State */}
	{error && (
		<div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 sm:p-5 md:p-6 text-center">
		<p className="text-red-400 font-bold mb-2 text-sm sm:text-base">Error loading data</p>
		<p className="text-text-light text-xs sm:text-sm">{error}</p>
		</div>
	)}

  {/* Games Grid */}
	{!initialLoading && games.length > 0 && (
		<div className="space-y-8 mb-16">
			{/* Live Games */}
			{liveGames.length > 0 && (
			<div>
				<h1 className="flex items-center gap-2 mx-2 mb-4">
				Live Now ({liveGames.length})
				</h1>
				{Object.entries(groupGamesByDate(liveGames)).map(([date, gamesWithTime]) => (
					<div key={date} className="mb-6">
						<h2 className="text-lg font-semibold text-neon-cyan mx-2 mb-3 text-left">{date}</h2>
						<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 px-2">
							{gamesWithTime.map((game) => (
								<GameGridCard key={game.id} game={game} navigate={navigate} league={league} />
							))}
						</div>
					</div>
				))}
			</div>
			)}

      {/* Upcoming Games */}
			{upcomingGames.length > 0 && (
			<div>
				<h2 className="flex items-center gap-2 mx-2 mb-4">
				Upcoming ({upcomingGames.length})
				</h2>
				{Object.entries(groupGamesByDate(upcomingGames)).map(([date, gamesWithTime]) => (
					<div key={date} className="mb-6">
						<h3 className="text-lg font-semibold text-neon-cyan mx-2 mb-3 text-left">{date}</h3>
						<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 px-2">
							{gamesWithTime.map((game) => (
								<GameGridCard key={game.id} game={game} navigate={navigate} league={league} />
							))}
						</div>
					</div>
				))}
			</div>
			)}
			
			{/* Completed Games */}
			{completedGames.length > 0 && (
			<div>
				<h1 className="flex items-center gap-2 mx-2 mb-4">
				Final ({completedGames.length})
				</h1>
				{Object.entries(groupGamesByDate(completedGames)).map(([date, gamesWithTime]) => (
					<div key={date} className="mb-6">
						<h2 className="text-lg font-semibold text-neon-cyan mx-2 mb-3 text-left">{date}</h2>
						<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 px-2">
							{gamesWithTime.map((game) => (
								<GameGridCard key={game.id} game={game} navigate={navigate} league={league} />
							))}
						</div>
					</div>
				))}
			</div>
			)}
			
		</div>
	)}

  {/* No Games */}
	{!initialLoading && games.length === 0 && !error && (
		<div className="text-center py-12 sm:py-16 md:py-20">
		<FaFootballBall className="text-4xl sm:text-5xl md:text-6xl text-neon-pink mx-auto mb-3 sm:mb-4" />
		<p className="text-text-light text-base sm:text-lg md:text-xl">No games scheduled at this time</p>
		</div>
	)}

  </div>
  </>
  );
};

// Game Grid Card Component
interface GameGridCardProps {
  game: Event & { timeKey?: string };
  navigate: (path: string) => void;
  league: string;
}

const GameGridCard: React.FC<GameGridCardProps> = ({ game, navigate, league }) => {
  const competition = game.competitions[0];
  const awayTeam = competition.competitors.find((c: Competitor) => c.homeAway === 'away');
  const homeTeam = competition.competitors.find((c: Competitor) => c.homeAway === 'home');
  
  if (!awayTeam || !homeTeam) return null;

  const isLive = competition.status.type.state === 'in';
  const isFinal = competition.status.type.completed;
  const isPre = competition.status.type.state === 'pre';

  return (
    <button
      onClick={() => navigate(`/${league}/game/${game.id}`)}
      className="relative rounded-md border border-neon-pink/20  bg-bg-dark/50 hover:bg-bg-dark/70 p-3 px-4 transition-all duration-200 text-left w-full"
    >
      {/* Time Header */}
      {game.timeKey && (
        <div className="text-xs text-gray-400 mb-2 font-medium">{game.timeKey}</div>
      )}

      {/* Live Badge */}
      {isLive && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-neon-cyan/20 border border-neon-cyan/50 rounded-full">
          <FaPlay className="text-[10px] text-neon-cyan animate-pulse" />
          <span className="text-xs font-bold text-neon-cyan">LIVE</span>
        </div>
      )}

      {/* Game Time/Status */}
      {isLive && (
        <div className="text-center mb-3">
          <div className="text-sm text-neon-cyan font-bold">
            Q{competition.status.period} - {competition.status.displayClock}
          </div>
        </div>
      )}

      {/* Teams */}
      <div>
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <img 
              src={awayTeam.team.logo} 
              alt={awayTeam.team.displayName}
              className="w-10 h-10 object-contain"
            />
            <div className="flex items-center gap-2">
              <div className={`font-bold ${awayTeam.winner ? 'text-neon-cyan' : 'text-white'}`}>
                {awayTeam.team.abbreviation}
              </div>
              <div className="text-xs text-gray-400">
                {awayTeam.records?.find((r: any) => r.type === 'total')?.summary || ''}
              </div>
            </div>
          </div>
          <div className={`text-2xl font-bold ${awayTeam.winner ? 'text-neon-cyan' : 'text-white'}`}>
            {awayTeam.score || '0'}
          </div>
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between space-y-2">
          <div className="flex items-center gap-3 flex-1">
            <img 
              src={homeTeam.team.logo} 
              alt={homeTeam.team.displayName}
              className="w-10 h-10 object-contain"
            />
            <div className="flex items-center gap-2">
              <div className={`font-bold ${homeTeam.winner ? 'text-neon-cyan' : 'text-white'}`}>
                {homeTeam.team.abbreviation}
              </div>
              <div className="text-xs text-gray-400">
                {homeTeam.records?.find((r: any) => r.type === 'total')?.summary || ''}
              </div>
            </div>
          </div>
          <div className={`text-2xl font-bold ${homeTeam.winner ? 'text-neon-cyan' : 'text-white'}`}>
            {homeTeam.score || '0'}
          </div>
        </div>
      </div>

    </button>
  );
};

export default GameGrid;
