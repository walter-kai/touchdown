'use client';

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FaFootballBall, FaPlay } from "react-icons/fa";
import LoginHero from '../../components/LoginHero';
import WeekNav from '../../components/navs/WeekNav';
import LoadingFootball from '../../components/loading/LoadingFootball';
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

interface GameWithLeague extends Event {
  leagueType: 'nfl' | 'nba';
  id: string;
  date: string;
  status: Event['status'];
  competitions: Event['competitions'];
}

interface UnifiedGameGridProps {
  preload?: boolean;
  onInitialReady?: () => void;
}

const GameGrid: React.FC<UnifiedGameGridProps> = ({ preload = false, onInitialReady }) => {
  const router = useRouter();
  const [games, setGames] = useState<GameWithLeague[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const initialReadyRef = useRef(false);

  const markInitialReady = useCallback(() => {
    if (!initialReadyRef.current) {
      initialReadyRef.current = true;
      onInitialReady?.();
    }
  }, [onInitialReady]);

  // Initialize from cache on client-side only (before fetch runs)
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return;
    
    try {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 14);
      
      const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
      };
      
      const datesParam = `${formatDate(startDate)}-${formatDate(endDate)}`;
      const cacheKey = `gamegrid_cache_${datesParam}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const cacheAge = Date.now() - timestamp;
        const CACHE_DURATION = 1 * 60 * 1000; // 1 minute
        
        if (cacheAge < CACHE_DURATION && Array.isArray(data)) {
          setGames(data);
          if (data.length > 0) {
            markInitialReady();
          }
        }
      }
    } catch (error) {
      console.error('Error reading initial cache:', error);
    }
    
    setIsInitialized(true);
  }, [isInitialized, markInitialReady]);

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

  const fetchAllGamesData = useCallback(async (date?: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Determine dates parameter - if no date provided, fetch current week
      let datesParam: string | undefined;
      if (date) {
        datesParam = date;
      } else {
        // Default: fetch this week and next week
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7); // Include last week
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 14); // Include next 2 weeks
        
        const formatDate = (d: Date) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}${month}${day}`;
        };
        
        datesParam = `${formatDate(startDate)}-${formatDate(endDate)}`;
      }
      
      // Check sessionStorage cache first
      const cacheKey = `gamegrid_cache_${datesParam}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          const cacheAge = Date.now() - timestamp;
          const CACHE_DURATION = 1 * 60 * 1000; // 1 minute
          
          if (cacheAge < CACHE_DURATION && Array.isArray(data)) {
            setGames(data);
            setIsLoading(false);
            if (data.length > 0) {
              markInitialReady();
            }
            return;
          } else {
            sessionStorage.removeItem(cacheKey);
          }
        } catch (error) {
          console.error('Error parsing cached games data:', error);
          sessionStorage.removeItem(cacheKey);
        }
      }
      
      // Fetch both NFL and NBA games
      const nflUrl = getScoreboardUrl('nfl', {
        dates: datesParam,
        limit: 100
      });
      
      const nbaUrl = getScoreboardUrl('nba', {
        dates: datesParam,
        limit: 100
      });

      const [nflResponse, nbaResponse] = await Promise.all([
        axios.get(nflUrl),
        axios.get(nbaUrl)
      ]);

      const nflEvents: GameWithLeague[] = (nflResponse.data.events || []).map((e: Event) => ({
        ...e,
        leagueType: 'nfl' as const
      }));

      const nbaEvents: GameWithLeague[] = (nbaResponse.data.events || []).map((e: Event) => ({
        ...e,
        leagueType: 'nba' as const
      }));

      // Combine and sort by date
      const allGames = [...nflEvents, ...nbaEvents].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Cache the games data
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: allGames,
        timestamp: Date.now()
      }));

      setGames(allGames);
      setIsLoading(false);
      if (allGames.length > 0) {
        markInitialReady();
      }
    } catch (err) {
      console.error('Error fetching games:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
      markInitialReady();
    }
  }, [preload, markInitialReady]);

  const handleDateSelect = useCallback((dateOrRange: string) => {
    setSelectedDate(dateOrRange);
  }, []);

  // Refresh scoreboard whenever date changes
  useEffect(() => {
    fetchAllGamesData(selectedDate || undefined);
  }, [fetchAllGamesData, selectedDate]);

  // Auto-refresh scoreboard every 1 minute if cache is expired
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Check if cache has expired
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 14);
      
      const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
      };
      
      const datesParam = selectedDate || `${formatDate(startDate)}-${formatDate(endDate)}`;
      const cacheKey = `gamegrid_cache_${datesParam}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const { timestamp } = JSON.parse(cachedData);
          const cacheAge = Date.now() - timestamp;
          const CACHE_DURATION = 1 * 60 * 1000; // 1 minute
          
          // If cache is older than 1 minute, refresh
          if (cacheAge >= CACHE_DURATION) {
            fetchAllGamesData(selectedDate || undefined);
          }
        } catch (error) {
          // If error parsing cache, refresh anyway
          fetchAllGamesData(selectedDate || undefined);
        }
      } else {
        // No cache, fetch data
        fetchAllGamesData(selectedDate || undefined);
      }
    }, 30 * 1000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [fetchAllGamesData, selectedDate]);

  // Helper function to group games by date with league separation
  const groupGamesByDateAndLeague = (gamesList: GameWithLeague[]) => {
    const grouped: Record<string, Record<'nfl' | 'nba', Array<GameWithLeague & { timeKey: string }>>> = {};
    
    gamesList.forEach(game => {
      const dateKey = new Date(game.date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });

      if (!grouped[dateKey]) {
        grouped[dateKey] = { nfl: [], nba: [] };
      }
      
      const timeKey = new Date(game.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      grouped[dateKey][game.leagueType].push({ ...game, timeKey });
    });
    
    return grouped;
  };

  // Categorize games by status
  const { liveGames, completedGames, upcomingGames } = useMemo(() => {
    const live = games.filter(game => game.status.type.state === 'in');
    const completed = games
      .filter(game => game.status.type.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const upcoming = games.filter(game => game.status.type.state === 'pre');
    
    return { liveGames: live, completedGames: completed, upcomingGames: upcoming };
  }, [games]);

  const renderGamesForDate = useCallback((gamesByLeague: Record<'nfl' | 'nba', Array<GameWithLeague & { timeKey: string }>>) => {
    // Combine NFL and NBA games, with NFL first
    const allGamesForDate = [...gamesByLeague.nfl, ...gamesByLeague.nba];
    
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 px-2">
        {allGamesForDate.map((game) => (
          <GameGridCard key={game.id} game={game} onNavigate={(path: string) => router.push(path)} />
        ))}
      </div>
    );
  }, [router]);

  return (
  <>
  <div className="max-w-7xl mx-auto py-2">
	
    {/* Sign Up Banner - When Not Logged In */}
    <LoginHero league="nfl" />

        {/* Week Navigation */}
        <WeekNav 
          onDateSelect={handleDateSelect}
          selectedDate={selectedDate || undefined}
        />

        {error ? (
          /* Error State */
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 sm:p-5 md:p-6 text-center">
            <p className="text-red-400 font-bold mb-2 text-sm sm:text-base">Error loading data</p>
            <p className="text-text-light text-xs sm:text-sm">{error}</p>
          </div>
        ) : isLoading && games.length === 0 ? (
          /* Loading State */
          <LoadingFootball message="Loading games..." />
        ) : games.length > 0 ? (
      /* Games Grid */
      <div className="space-y-8 mb-16">
        {/* Live Games */}
        {liveGames.length > 0 && (
          <div>
            <h1 className="flex items-center gap-2 mx-2 mb-4">
              Live Now ({liveGames.length})
            </h1>
            {Object.entries(groupGamesByDateAndLeague(liveGames)).map(([date, gamesByLeague]) => (
              <div key={date} className="mb-6">
                <h2 className="mx-2 mb-3 text-left">{date}</h2>
                {renderGamesForDate(gamesByLeague)}
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
            {Object.entries(groupGamesByDateAndLeague(upcomingGames)).map(([date, gamesByLeague]) => (
              <div key={date} className="mb-6">
                <h3 className="mx-2 mb-3 text-left">{date}</h3>
                {renderGamesForDate(gamesByLeague)}
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
            {Object.entries(groupGamesByDateAndLeague(completedGames)).map(([date, gamesByLeague]) => (
              <div key={date} className="mb-6">
                <h2 className="mx-2 mb-3 text-left">{date}</h2>
                {renderGamesForDate(gamesByLeague)}
              </div>
            ))}
          </div>
        )}
      </div>
    ) : null}

  </div>
  </>
  );
};

// Game Grid Card Component
interface GameGridCardProps {
  game: GameWithLeague & { timeKey?: string };
  onNavigate: (path: string) => void;
}

const GameGridCard: React.FC<GameGridCardProps> = ({ game, onNavigate }) => {
  const competition = game.competitions[0];
  const awayTeam = competition.competitors.find((c: Competitor) => c.homeAway === 'away');
  const homeTeam = competition.competitors.find((c: Competitor) => c.homeAway === 'home');
  
  if (!awayTeam || !homeTeam) return null;

  const isLive = competition.status.type.state === 'in';
  const isFinal = competition.status.type.completed;
  const isPre = competition.status.type.state === 'pre';

  const leagueLogoUrl = game.leagueType === 'nfl' 
    ? '/logos/logo-nfl.svg'
    : '/logos/logo-nba.svg';

  return (
    <button
      onClick={() => onNavigate(`/${game.leagueType}/game/${game.id}`)}
      className="relative rounded-md border border-neon-pink/20  bg-bg-dark/50 hover:bg-bg-dark/70 p-3 px-4 transition-all duration-200 text-left w-full"
    >
      {/* League Logo + Time Header */}
      <div className="flex items-center gap-2 mb-2">
        <img 
          src={leagueLogoUrl}
          alt={game.leagueType.toUpperCase()}
          className="h-5 w-5"
        />
        {game.timeKey && (
          <span className="text-xs text-gray-400 font-medium">{game.timeKey}</span>
        )}
      </div>

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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 flex-1">
            <img 
              src={awayTeam.team.logo} 
              alt={awayTeam.team.displayName}
              className="w-10 h-10 object-contain"
            />
            <div className="flex flex-col">
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <img 
              src={homeTeam.team.logo} 
              alt={homeTeam.team.displayName}
              className="w-10 h-10 object-contain"
            />
            <div className="flex flex-col">
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
