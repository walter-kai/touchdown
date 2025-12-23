import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import axios from 'axios';
import { useLeague } from '@/providers/LeagueContext';
import { getScoreboardUrl } from '@/utils/espnApi';

interface WeekNavProps {
  onDateSelect?: (date: string) => void;
  selectedDate?: string;
}

interface DayInfo {
  date: string;
  dayName: string;
  dayNumber: string;
  month: string;
  hasGames: boolean;
  gameCount: number;
}

const WeekNav: React.FC<WeekNavProps> = ({ onDateSelect, selectedDate }) => {
  const { league } = useLeague();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
  const [weekDays, setWeekDays] = useState<DayInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate 7 consecutive days starting from Monday of the week
  const generateWeekDays = (startDate: Date): Date[] => {
    // Get Monday of the week
    const monday = new Date(startDate);
    const dayOfWeek = monday.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days, otherwise go to Monday
    monday.setDate(monday.getDate() + diff);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Format date to YYYYMMDD for ESPN API
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  // Fetch game counts for the week
  useEffect(() => {
    const fetchGameCounts = async () => {
      setLoading(true);
      const days = generateWeekDays(currentWeekStart);
      
      try {
        // Fetch scoreboard for the entire week range
        const startDate = formatDateForAPI(days[0]);
        const endDate = formatDateForAPI(days[days.length - 1]);
        
        // Use centralized API utility
        const url = getScoreboardUrl(league, {
          dates: `${startDate}-${endDate}`,
          limit: 100
        });

        const response = await axios.get(url);
        
        // Both NFL and NBA have events at root level when using site.api.espn.com
        const events = response.data.events || [];
        
        // Count games per day
        const gamesByDate: Record<string, number> = {};
        events.forEach((event: any) => {
          if (event.date) {
            const eventDate = formatDateForAPI(new Date(event.date));
            gamesByDate[eventDate] = (gamesByDate[eventDate] || 0) + 1;
          }
        });

        // Build day info with game counts
        const dayInfos: DayInfo[] = days.map(day => {
          const dateStr = formatDateForAPI(day);
          return {
            date: dateStr,
            dayName: day.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNumber: day.getDate().toString(),
            month: day.toLocaleDateString('en-US', { month: 'short' }),
            hasGames: (gamesByDate[dateStr] || 0) > 0,
            gameCount: gamesByDate[dateStr] || 0
          };
        });

        setWeekDays(dayInfos);
      } catch (error) {
        console.error('Error fetching game counts:', error);
        // Fallback: show days without game counts
        const dayInfos: DayInfo[] = days.map(day => ({
          date: formatDateForAPI(day),
          dayName: day.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: day.getDate().toString(),
          month: day.toLocaleDateString('en-US', { month: 'short' }),
          hasGames: false,
          gameCount: 0
        }));
        setWeekDays(dayInfos);
      } finally {
        setLoading(false);
      }
    };

    fetchGameCounts();
  }, [currentWeekStart, league]);

  // Auto-select the week range whenever weekDays changes (including navigation)
  useEffect(() => {
    if (onDateSelect && !loading && weekDays.length > 0) {
      const startDate = weekDays[0].date;
      const endDate = weekDays[weekDays.length - 1].date;
      const dateRange = `${startDate}-${endDate}`;
      console.log('WeekNav: Week changed, auto-selecting range:', dateRange);
      onDateSelect(dateRange);
    }
  }, [weekDays, loading]); // Trigger whenever weekDays updates

  const handlePreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    console.log('WeekNav: Previous week clicked, new start:', newStart);
    setCurrentWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    console.log('WeekNav: Next week clicked, new start:', newStart);
    setCurrentWeekStart(newStart);
  };

  const handleDayClick = (date: string) => {
    if (onDateSelect && weekDays.length > 0) {
      const startDate = weekDays[0].date;
      const endDate = weekDays[weekDays.length - 1].date;
      const dateRange = `${startDate}-${endDate}`;
      console.log('WeekNav: Day clicked, sending range:', dateRange, 'Current selected:', selectedDate);
      onDateSelect(dateRange);
    }
  };

  const today = formatDateForAPI(new Date());

  return (
    <div className="bg-bg-darker/80 rounded-xl py-3 px-2 mb-4 border border-gray-800/50">
      <h1 className="text-white/70 text-sm font-semibold mb-3 px-1">Games this Week</h1>
      
      {/* Week Navigation Chevrons - Above */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={handlePreviousWeek}
          className="flex-1 bg-bg-dark/60 hover:bg-bg-dark/80 border border-gray-800/50 hover:border-neon-cyan/30 rounded-lg py-2 transition-all group flex items-center justify-center"
          aria-label="Previous Week"
        >
          <FaChevronLeft className="text-gray-500 group-hover:text-neon-cyan/70 text-sm" />
          <span className="ml-2 text-xs text-gray-500 group-hover:text-neon-cyan/70 font-medium">Previous</span>
        </button>
        <button
          onClick={handleNextWeek}
          className="flex-1 bg-bg-dark/60 hover:bg-bg-dark/80 border border-gray-800/50 hover:border-neon-cyan/30 rounded-lg py-2 transition-all group flex items-center justify-center"
          aria-label="Next Week"
        >
          <span className="mr-2 text-xs text-gray-500 group-hover:text-neon-cyan/70 font-medium">Next</span>
          <FaChevronRight className="text-gray-500 group-hover:text-neon-cyan/70 text-sm" />
        </button>
      </div>

      {/* 7 Day Calendar */}
      <div className="grid grid-cols-7 gap-1">
          {loading ? (
            // Loading skeleton
            Array(7).fill(0).map((_, idx) => (
              <div key={idx} className="bg-bg-darker/50 rounded-lg h-[72px] animate-pulse" />
            ))
          ) : (
            weekDays.map((day) => {
              const isInSelectedRange = selectedDate?.includes(day.date) || selectedDate?.includes('-');
              const isToday = day.date === today;

              return (
                <button
                  key={day.date}
                  onClick={() => handleDayClick(day.date)}
                  className={`
                    relative rounded-lg p-2 transition-all h-[68px] flex flex-col items-center justify-center
                    ${isInSelectedRange
                      ? 'bg-bg-dark/90 border border-neon-cyan/40 shadow-[0_0_8px_rgba(0,255,231,0.15)]' 
                      : day.hasGames
                      ? 'bg-bg-dark/50 border border-gray-800/50 hover:border-neon-cyan/30 hover:bg-bg-dark/70'
                      : 'bg-bg-dark/30 border border-gray-800/30 hover:border-gray-700/50'
                    }
                  `}
                >
                  {/* Day Name */}
                  <div className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${
                    isInSelectedRange ? 'text-neon-cyan/80' : isToday ? 'text-neon-pink/70' : 'text-gray-500'
                  }`}>
                    {day.dayName}
                  </div>

                  {/* Day Number */}
                  <div className={`text-xl font-bold leading-none mb-0.5 ${
                    isInSelectedRange ? 'text-neon-cyan' : isToday ? 'text-neon-pink' : 'text-white/80'
                  }`}>
                    {day.dayNumber}
                  </div>

                  {/* Month */}
                  <div className={`text-[8px] uppercase font-semibold ${
                    isInSelectedRange ? 'text-neon-cyan/50' : 'text-gray-600'
                  }`}>
                    {day.month}
                  </div>

                  {/* Game Indicator Dots */}
                  {day.hasGames && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-[2px]">
                      {Array.from({ length: Math.min(day.gameCount, 5) }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-1 h-1 rounded-full ${
                            isInSelectedRange ? 'bg-neon-cyan/60' : 'bg-neon-pink/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Today Badge */}
                  {isToday && !isInSelectedRange && (
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-neon-pink/70 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })
          )}
        </div>
    </div>
  );
};

export default WeekNav;
