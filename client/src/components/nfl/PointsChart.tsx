import React, { useMemo } from "react";
import { FaChartBar, FaFootballBall } from "react-icons/fa";

interface ScoringPlay {
  text: string;
  quarter: number;
  clock: string;
  timestamp: Date;
  homeScore?: number;
  awayScore?: number;
}

interface PointsChartProps {
  gameId: string;
  homeTeamInfo: { name: string; logo: string; color: string };
  awayTeamInfo: { name: string; logo: string; color: string };
  scoringPlays: ScoringPlay[];
  gameStatus: string;
}

interface TimeInterval {
  label: string;
  startMinute: number;
  endMinute: number;
  homePoints: number;
  awayPoints: number;
}

const PointsChart: React.FC<PointsChartProps> = ({ 
  gameId, 
  homeTeamInfo, 
  awayTeamInfo, 
  scoringPlays,
  gameStatus
}) => {
  // Calculate total game time in minutes (4 quarters x 15 minutes = 60 minutes)
  const totalGameMinutes = 60;
  
  // Group scoring plays into 5-minute intervals
  const intervals = useMemo(() => {
    const intervalData: TimeInterval[] = [];
    const intervalSize = 5; // 5-minute intervals
    
    // Create intervals for the entire game
    for (let i = 0; i < totalGameMinutes; i += intervalSize) {
      intervalData.push({
        label: `${i}-${i + intervalSize}`,
        startMinute: i,
        endMinute: i + intervalSize,
        homePoints: 0,
        awayPoints: 0
      });
    }
    
    // Process each scoring play
    let prevHomeScore = 0;
    let prevAwayScore = 0;
    
    scoringPlays.forEach((play) => {
      // Parse clock to get minutes elapsed
      const quarter = play.quarter;
      const clockParts = play.clock.split(':');
      const minutesLeft = parseInt(clockParts[0]) || 0;
      const secondsLeft = parseInt(clockParts[1]) || 0;
      
      // Calculate elapsed time in minutes
      const quarterStartMinute = (quarter - 1) * 15;
      const elapsedInQuarter = 15 - (minutesLeft + secondsLeft / 60);
      const totalElapsed = quarterStartMinute + elapsedInQuarter;
      
      // Find the interval this play belongs to
      const intervalIndex = Math.floor(totalElapsed / intervalSize);
      
      if (intervalIndex >= 0 && intervalIndex < intervalData.length) {
        const interval = intervalData[intervalIndex];
        
        // Calculate points scored on this play
        const currentHomeScore = play.homeScore || 0;
        const currentAwayScore = play.awayScore || 0;
        
        const homePointsScored = currentHomeScore - prevHomeScore;
        const awayPointsScored = currentAwayScore - prevAwayScore;
        
        interval.homePoints += homePointsScored;
        interval.awayPoints += awayPointsScored;
        
        prevHomeScore = currentHomeScore;
        prevAwayScore = currentAwayScore;
      }
    });
    
    // Filter out intervals with no activity to show only relevant game time
    const lastActiveInterval = intervalData.findIndex((interval, idx) => {
      // Check if this interval or any subsequent interval has points
      return intervalData.slice(idx).some(int => int.homePoints > 0 || int.awayPoints > 0);
    });
    
    if (lastActiveInterval === -1) return intervalData.slice(0, 4); // Show at least first 20 minutes
    
    // Find the last interval with activity
    const lastActive = intervalData.reduceRight((foundIdx, interval, idx) => {
      if (foundIdx !== -1) return foundIdx;
      return interval.homePoints > 0 || interval.awayPoints > 0 ? idx : -1;
    }, -1);
    
    return intervalData.slice(0, Math.max(lastActive + 2, 4)); // Show until last activity + 1 interval
  }, [scoringPlays, totalGameMinutes]);
  
  // Calculate max points for scaling
  const maxPoints = useMemo(() => {
    return Math.max(
      ...intervals.map(i => Math.max(i.homePoints, i.awayPoints)),
      7 // Minimum scale of 7 points
    );
  }, [intervals]);
  
  // Calculate total points scored
  const totalHomePoints = intervals.reduce((sum, interval) => sum + interval.homePoints, 0);
  const totalAwayPoints = intervals.reduce((sum, interval) => sum + interval.awayPoints, 0);
  
  if (scoringPlays.length === 0) {
    return (
      <div className="bg-[#181a23]/95 rounded-xl border border-[#00ffe7]/30 p-6 text-center">
        <p className="text-gray-400">No scoring data available yet</p>
      </div>
    );
  }
  
  return (
    <div className="bg-[#181a23]/95 rounded-xl py-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <FaChartBar className="text-[#00ffe7] text-lg sm:text-xl" />
          <h3 className="text-base sm:text-lg font-bold text-[#00ffe7]">Scoring by Time</h3>
        </div>
      </div>

      {/* Team Labels */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-br from-[#00ffe7]/70 to-[#00ffe7]/50 rounded"></div>
          <span className="text-sm font-semibold text-[#e0e7ef]">{awayTeamInfo.name}</span>
          <span className="text-xs text-gray-400">({totalAwayPoints} pts)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">({totalHomePoints} pts)</span>
          <span className="text-sm font-semibold text-[#e0e7ef]">{homeTeamInfo.name}</span>
          <div className="w-3 h-3 bg-gradient-to-br from-[#faafe8]/70 to-[#faafe8]/50 rounded"></div>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-3 mb-6">
        {intervals.map((interval, idx) => {
          const homeHeight = interval.homePoints > 0 ? (interval.homePoints / maxPoints) * 100 : 0;
          const awayHeight = interval.awayPoints > 0 ? (interval.awayPoints / maxPoints) * 100 : 0;
          const maxHeight = Math.max(homeHeight, awayHeight);
          
          return (
            <div key={idx} className="flex items-center gap-2">
              {/* Time label */}
              <div className="w-16 text-xs text-gray-400 text-right font-mono">
                {interval.label} min
              </div>
              
              {/* Bars container */}
              <div className="flex-1 flex items-center gap-1">
                {/* Away team bar (left side - cyan) */}
                <div className="flex-1 h-8 bg-[#23263a]/50 rounded-l-lg overflow-hidden flex items-center justify-end relative">
                  {interval.awayPoints > 0 && (
                    <>
                      <div 
                        className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-[#00ffe7]/70 to-[#00ffe7]/50 transition-all duration-300"
                        style={{ width: `${awayHeight}%` }}
                      />
                      <span className="relative z-10 text-xs font-bold text-white pr-2">
                        {interval.awayPoints}
                      </span>
                    </>
                  )}
                </div>
                
                {/* Divider */}
                <div className="w-px h-8 bg-[#faafe8]/20"></div>
                
                {/* Home team bar (right side - pink) */}
                <div className="flex-1 h-8 bg-[#23263a]/50 rounded-r-lg overflow-hidden flex items-center justify-start relative">
                  {interval.homePoints > 0 && (
                    <>
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#faafe8]/70 to-[#faafe8]/50 transition-all duration-300"
                        style={{ width: `${homeHeight}%` }}
                      />
                      <span className="relative z-10 text-xs font-bold text-white pl-2">
                        {interval.homePoints}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 bg-[#23263a]/50 rounded-lg text-center">
          <div className="text-xs text-gray-400 mb-1">Scoring Plays</div>
          <div className="text-lg font-bold text-[#00ffe7]">{scoringPlays.length}</div>
        </div>
        <div className="p-3 bg-[#23263a]/50 rounded-lg text-center">
          <div className="text-xs text-gray-400 mb-1">Highest Interval</div>
          <div className="text-lg font-bold text-[#faafe8]">{maxPoints} pts</div>
        </div>
        <div className="p-3 bg-[#23263a]/50 rounded-lg text-center">
          <div className="text-xs text-gray-400 mb-1">Total Points</div>
          <div className="text-lg font-bold text-white">{totalHomePoints + totalAwayPoints}</div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-4 pt-4 border-t border-[#faafe8]/20">
        <p className="text-xs text-gray-500 text-center">
          Points aggregated in 5-minute intervals • {intervals.length * 5} minutes of game time shown
        </p>
      </div>
    </div>
  );
};

export default PointsChart;
