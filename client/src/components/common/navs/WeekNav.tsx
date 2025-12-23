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
  const [currentWeekStart, setCurrentWeekStart] = useState<Date | null>(null);
  const [weekDays, setWeekDays] = useState<DayInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [cachedEvents, setCachedEvents] = useState<any[]>([]);
  const [selectedSingleDay, setSelectedSingleDay] = useState<string | null>(null);

  // Find the next week with games, starting from current date
  const findNextWeekWithGames = async (startFrom: Date): Promise<{ weekStart: Date; events: any[] }> => {
    let checkDate = new Date(startFrom);
    const maxWeeksToCheck = 4; // Check up to 4 weeks ahead
    
    for (let i = 0; i < maxWeeksToCheck; i++) {
      const days = generateWeekDays(checkDate);
      const startDate = formatDateForAPI(days[0]);
      const endDate = formatDateForAPI(days[days.length - 1]);
      
      try {
        const url = getScoreboardUrl(league, {
          dates: `${startDate}-${endDate}`,
          limit: 100
        });
        
        const response = await axios.get(url);
        const events = response.data.events || [];
        
        // If we found games, return this week and cache the events
        if (events.length > 0) {
          console.log('Found games starting from week of:', days[0]);
          return { weekStart: checkDate, events };
        }
      } catch (error) {
        console.error('Error checking for games:', error);
      }
      
      // Move to next week
      checkDate = new Date(checkDate);
      checkDate.setDate(checkDate.getDate() + 7);
    }
    
    // If no games found in next 4 weeks, just return the original date
    return { weekStart: startFrom, events: [] };
  };

  // Initialize with the correct week on first load
  useEffect(() => {
    const initializeWeek = async () => {
      const today = new Date();
      const { weekStart, events } = await findNextWeekWithGames(today);
      setCachedEvents(events);
      setCurrentWeekStart(weekStart);
    };
    
    initializeWeek();
  }, [league]); // Re-initialize when league changes

  // Generate 7 consecutive days starting from Thursday (NFL week: Thu-Wed)
  const generateWeekDays = (startDate: Date): Date[] => {
    // Get Thursday of the current week
    const thursday = new Date(startDate);
    const dayOfWeek = thursday.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    
    // Calculate offset to get to Thursday
    let offset;
    if (dayOfWeek === 0) { // Sunday
      offset = 4; // Go to next Thursday
    } else if (dayOfWeek === 1) { // Monday - part of previous week (goes with Thu-Sun)
      offset = 3; // Go to next Thursday
    } else if (dayOfWeek === 2) { // Tuesday
      offset = 2; // Go to next Thursday  
    } else if (dayOfWeek === 3) { // Wednesday
      offset = 1; // Go to next Thursday
    } else { // Thursday (4), Friday (5), Saturday (6)
      offset = -(dayOfWeek - 4); // Go back to Thursday of this week
    }
    
    thursday.setDate(thursday.getDate() + offset);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(thursday);
      day.setDate(thursday.getDate() + i);
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

  // Format date range for button display (e.g., "Dec 26-Jan 1")
  const formatDateRangeForDisplay = (startDate: Date): string => {
    const days = generateWeekDays(startDate);
    const firstDay = days[0];
    const lastDay = days[days.length - 1];
    
    const startMonth = firstDay.toLocaleDateString('en-US', { month: 'short' });
    const startDay = firstDay.getDate();
    const endMonth = lastDay.toLocaleDateString('en-US', { month: 'short' });
    const endDay = lastDay.getDate();
    
    // If same month, show "Dec 26-31"
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}`;
    }
    // If different months, show "Dec 26-Jan 1"
    return `${startMonth} ${startDay}-${endMonth} ${endDay}`;
  };

  // Fetch game counts for the week
  useEffect(() => {
    // Don't fetch until we have determined the correct week
    if (!currentWeekStart) return;
    
    const fetchGameCounts = async () => {
      setLoading(true);
      const days = generateWeekDays(currentWeekStart);
      
      try {
        let events = cachedEvents;
        
        // Only fetch if we don't have cached events for this week
        if (!cachedEvents || cachedEvents.length === 0) {
          const startDate = formatDateForAPI(days[0]);
          const endDate = formatDateForAPI(days[days.length - 1]);
          
          const url = getScoreboardUrl(league, {
            dates: `${startDate}-${endDate}`,
            limit: 100
          });

          const response = await axios.get(url);
          events = response.data.events || [];
        } else {
          console.log('Using cached events for game counts');
        }
        
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
      // If a single day is already selected, don't override it
      if (selectedSingleDay) {
        console.log('WeekNav: Keeping single day selection:', selectedSingleDay);
        return;
      }
      
      const startDate = weekDays[0].date;
      const endDate = weekDays[weekDays.length - 1].date;
      const dateRange = `${startDate}-${endDate}`;
      console.log('WeekNav: Week changed, auto-selecting range:', dateRange);
      onDateSelect(dateRange);
    }
  }, [weekDays, loading, selectedSingleDay]); // Trigger whenever weekDays updates

  const handlePreviousWeek = () => {
    if (!currentWeekStart) return;
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    console.log('WeekNav: Navigating to last week:', newStart);
    setCachedEvents([]); // Clear cache when navigating
    setSelectedSingleDay(null); // Clear single day selection
    setCurrentWeekStart(newStart);
  };

  const handleNextWeek = () => {
    if (!currentWeekStart) return;
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    console.log('WeekNav: Navigating to next week:', newStart);
    setCachedEvents([]); // Clear cache when navigating
    setSelectedSingleDay(null); // Clear single day selection
    setCurrentWeekStart(newStart);
  };

  const handleDayClick = (date: string) => {
    if (onDateSelect) {
      // If clicking the same day, untoggle and show full week
      if (selectedSingleDay === date) {
        console.log('WeekNav: Untoggling day, showing full week');
        setSelectedSingleDay(null);
        if (weekDays.length > 0) {
          const startDate = weekDays[0].date;
          const endDate = weekDays[weekDays.length - 1].date;
          const dateRange = `${startDate}-${endDate}`;
          console.log('WeekNav: Selecting full week range:', dateRange);
          onDateSelect(dateRange);
        }
      } else {
        // Select single day
        console.log('WeekNav: Selecting single day:', date);
        setSelectedSingleDay(date);
        onDateSelect(date);
      }
    }
  };

  const today = formatDateForAPI(new Date());

  // Calculate previous and next week date ranges for button labels
  const getPreviousWeekLabel = (): string => {
    if (!currentWeekStart) return 'Last Week';
    const prevWeek = new Date(currentWeekStart);
    prevWeek.setDate(prevWeek.getDate() - 7);
    return formatDateRangeForDisplay(prevWeek);
  };

  const getNextWeekLabel = (): string => {
    if (!currentWeekStart) return 'Next Week';
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return formatDateRangeForDisplay(nextWeek);
  };

  return (
    <div className="rounded-xl py-3 mb-4 px-2">
      <h1 className="">Games this Week</h1>
      
      {/* Week Navigation Chevrons - Above */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={handlePreviousWeek}
          className="flex-1 bg-bg-dark/60 hover:bg-bg-dark/80 border border-gray-800/50 hover:border-neon-cyan/30 rounded-lg py-2 transition-all group flex items-center justify-center"
          aria-label="Last Week"
        >
          <FaChevronLeft className="text-neon-cyan group-hover:text-neon-cyan/70 text-sm" />
          <span className="ml-2 text-xs text-neon-cyan group-hover:text-neon-cyan/70 font-medium">{getPreviousWeekLabel()}</span>
        </button>
        
        {/* Current Week Display */}
        <div className="flex-[1.2]  py-2 flex items-center justify-center">
          <span className="text-xs text-neon-cyan/60 font-semibold">
            {currentWeekStart ? formatDateRangeForDisplay(currentWeekStart) : 'Loading...'}
          </span>
        </div>
        
        <button
          onClick={handleNextWeek}
          className="flex-1 bg-bg-dark/60 hover:bg-bg-dark/80 border border-gray-800/50 hover:border-neon-cyan/30 rounded-lg py-2 transition-all group flex items-center justify-center"
          aria-label="Next Week"
        >
          <span className="mr-2 text-xs text-neon-cyan group-hover:text-neon-cyan/70 font-medium">{getNextWeekLabel()}</span>
          <FaChevronRight className="text-neon-cyan group-hover:text-neon-cyan/70 text-sm" />
        </button>
      </div>

      {/* 7 Day Calendar */}
      <div className="flex gap-1">
          {loading ? (
            // Loading skeleton
            Array(7).fill(0).map((_, idx) => (
              <div key={idx} className="flex-1 bg-bg-darker/50 rounded-lg h-[72px] animate-pulse" />
            ))
          ) : (
            weekDays.map((day) => {
              const isSingleDaySelected = selectedSingleDay === day.date;
              const isInSelectedRange = isSingleDaySelected || selectedDate?.includes(day.date) || selectedDate?.includes('-');
              const isToday = day.date === today;

              return (
                <button
                  key={day.date}
                  onClick={() => handleDayClick(day.date)}
                  className={`
                    relative rounded-lg p-2 transition-all h-[68px] flex flex-col items-center justify-center
                    ${day.hasGames ? 'flex-[1.5]' : 'flex-[0.5]'}
                    ${isInSelectedRange
                      ? 'bg-bg-dark/90 border border-neon-cyan/10 shadow-[0_0_8px_rgba(0,255,231,0.15)]' 
                      : day.hasGames
                      ? 'bg-bg-dark/30 border border-gray-800/30 hover:border-neon-cyan/30 hover:bg-bg-dark/50'
                      : 'bg-bg-dark/10 border border-gray-800/20 hover:border-gray-700/30 opacity-50'
                    }
                  `}
                >
                  {/* Day Name */}
                  <div className={`font-bold uppercase tracking-wider mb-0.5 ${
                    day.hasGames ? 'text-[9px]' : 'text-[8px]'
                  } ${
                    isInSelectedRange && day.hasGames ? 'text-neon-cyan/80' : isToday ? 'text-neon-pink/70' : day.hasGames ? 'text-gray-500' : 'text-neon-cyan/50'
                  }`}>
                    {day.dayName}
                  </div>

                  {/* Day Number */}
                  <div className={`font-bold leading-none mb-0.5 ${
                    day.hasGames ? 'text-xl' : 'text-base'
                  } ${
                    isInSelectedRange && day.hasGames ? 'text-neon-cyan' : isToday ? 'text-neon-pink' : day.hasGames ? 'text-white/80' : 'text-neon-cyan/50'
                  }`}>
                    {day.dayNumber}
                  </div>

                  {/* Month */}
                  <div className={`uppercase font-semibold ${
                    day.hasGames ? 'text-[8px]' : 'text-[7px]'
                  } ${
                    isInSelectedRange && day.hasGames ? 'text-neon-cyan/50' : day.hasGames ? 'text-gray-600' : 'text-neon-cyan/50'
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
