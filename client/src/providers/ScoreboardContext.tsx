import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import type { Event, TeamOnBye } from '@/types/espn/scoreboard';
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

interface ScoreboardContextType {
  games: Event[];
  news: NewsArticle[];
  byeTeams: TeamOnBye[];
  weekNumber: number | null;
  selectedWeek: number | null;
  lastUpdated: Date | null;
  countdown: number;
  isRefreshing: boolean;
  initialLoading: boolean;
  error: string | null;
  fetchScoreboardData: (week?: number) => Promise<void>;
  setSelectedWeek: (week: number) => void;
  handlePreviousWeek: () => void;
  handleNextWeek: () => void;
}

const ScoreboardContext = createContext<ScoreboardContextType | undefined>(undefined);

export const ScoreboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [games, setGames] = useState<Event[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [byeTeams, setByeTeams] = useState<TeamOnBye[]>([]);
  const [weekNumber, setWeekNumber] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get date range for a specific NFL week
  const getWeekDateRange = (week: number): string => {
    // 2025 NFL Season: Week 1 started on Thursday, Sept 4, 2025
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

  const fetchScoreboardData = useCallback(async (week?: number) => {
    try {
      setIsRefreshing(true);
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
  }, [selectedWeek]);

  const handlePreviousWeek = useCallback(() => {
    if (selectedWeek && selectedWeek > 1) {
      const newWeek = selectedWeek - 1;
      setSelectedWeek(newWeek);
      fetchScoreboardData(newWeek);
    }
  }, [selectedWeek, fetchScoreboardData]);

  const handleNextWeek = useCallback(() => {
    if (selectedWeek && selectedWeek < 18) {
      const newWeek = selectedWeek + 1;
      setSelectedWeek(newWeek);
      fetchScoreboardData(newWeek);
    }
  }, [selectedWeek, fetchScoreboardData]);

  // Initial fetch on mount
  useEffect(() => {
    fetchScoreboardData();
  }, []);

  // Countdown timer effect with auto-refresh
  useEffect(() => {
    if (countdown <= 0) {
      fetchScoreboardData(selectedWeek || undefined);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, selectedWeek, fetchScoreboardData]);

  return (
    <ScoreboardContext.Provider
      value={{
        games,
        news,
        byeTeams,
        weekNumber,
        selectedWeek,
        lastUpdated,
        countdown,
        isRefreshing,
        initialLoading,
        error,
        fetchScoreboardData,
        setSelectedWeek,
        handlePreviousWeek,
        handleNextWeek,
      }}
    >
      {children}
    </ScoreboardContext.Provider>
  );
};

export const useScoreboard = () => {
  const context = useContext(ScoreboardContext);
  if (!context) {
    throw new Error('useScoreboard must be used within a ScoreboardProvider');
  }
  return context;
};
