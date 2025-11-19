import React, { useMemo, useState } from "react";
import { FaChartLine, FaTimes } from "react-icons/fa";

interface ProbabilityItem {
  tiePercentage: number;
  homeWinPercentage: number;
  awayWinPercentage: number;
  lastModified: string;
  sequenceNumber: string;
  secondsLeft: number;
  spreadCoverProbHome: number;
  spreadPushProb: number;
  totalOverProb: number;
  totalPushProb: number;
}

interface OddsData {
  count: number;
  items: ProbabilityItem[];
}

interface OddsProps {
  data: OddsData;
  homeTeamInfo: { name: string; logo: string; color: string };
  awayTeamInfo: { name: string; logo: string; color: string };
  onClose: () => void;
}

const Odds: React.FC<OddsProps> = ({ data, homeTeamInfo, awayTeamInfo, onClose }) => {
  // Filter out pre-game data and sort by time
  const filteredData = useMemo(() => {
    if (!data.items || data.items.length === 0) return [];
    
    // Filter out pre-game data (sequence numbers less than 100)
    const filtered = data.items.filter(item => {
      const seqNum = parseInt(item.sequenceNumber);
      return seqNum >= 100; // Only include actual game plays
    });
    
    // Sort by lastModified time (oldest to newest)
    return filtered.sort((a, b) => 
      new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime()
    );
  }, [data.items]);

  // Get the latest probability (most recent by time)
  const latestProb = useMemo(() => {
    if (filteredData.length === 0) {
      // Fallback to original data if no filtered data
      if (!data.items || data.items.length === 0) return null;
      // Sort original data by time and get the latest
      const sorted = [...data.items].sort((a, b) => 
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      );
      return sorted[0];
    }
    return filteredData[filteredData.length - 1]; // Last item after sorting by time
  }, [filteredData, data.items]);

  // Calculate win probability trend over time
  const probTrend = useMemo(() => {
    const dataToUse = filteredData.length > 0 ? filteredData : data.items;
    if (!dataToUse || dataToUse.length < 2) return null;
    
    // Data is already sorted by time, just sample evenly
    const targetSamples = Math.min(20, dataToUse.length);
    const step = Math.max(1, Math.floor(dataToUse.length / targetSamples));
    const samples = dataToUse.filter((_, idx) => idx % step === 0);
    
    // Ensure we include the very last data point (most recent)
    if (samples[samples.length - 1] !== dataToUse[dataToUse.length - 1]) {
      samples.push(dataToUse[dataToUse.length - 1]);
    }
    
    return samples;
  }, [filteredData, data.items]);

  // State for draggable cursor - shared across all charts
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle mouse events for draggable cursor - works with currentTarget
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    updateCursorPositionFromMouse(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updateCursorPositionFromMouse(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (!isDragging) {
      setCursorPosition(null);
    }
  };

  const updateCursorPositionFromMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setCursorPosition(percentage);
  };

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    updateCursorPositionFromTouch(e);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isDragging) {
      updateCursorPositionFromTouch(e);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // Keep cursor visible on mobile after touch
  };

  const updateCursorPositionFromTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setCursorPosition(percentage);
  };

  // Get the data point at cursor position
  const getCursorData = () => {
    if (cursorPosition === null || !probTrend) return null;
    
    const index = Math.floor((cursorPosition / 100) * (probTrend.length - 1));
    return probTrend[Math.max(0, Math.min(index, probTrend.length - 1))];
  };

  const cursorData = getCursorData();

  if (!latestProb) {
    return (
      <div className="bg-[#181a23]/95 rounded-xl border border-[#00ffe7]/30 p-4 text-center">
        <p className="text-gray-400">No odds data available</p>
      </div>
    );
  }

  // Use cursor data if available, otherwise use latest
  const displayData = cursorData || latestProb;
  const homeWinPct = (displayData.homeWinPercentage * 100).toFixed(1);
  const awayWinPct = (displayData.awayWinPercentage * 100).toFixed(1);
  const tiePct = (displayData.tiePercentage * 100).toFixed(1);

  return (
    <div className="bg-[#181a23]/95 rounded-xl border border-[#faafe8]/30 p-4 sm:p-6 shadow-[0_0_16px_rgba(250,175,232,0.2)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <FaChartLine className="text-[#faafe8] text-lg sm:text-xl" />
          <h3 className="text-base sm:text-lg font-bold text-[#faafe8]">Live Win Probability</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-[#faafe8] transition-colors p-1"
        >
          <FaTimes className="text-lg" />
        </button>
      </div>

      {/* Current Win Probability */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src={awayTeamInfo.logo} alt={awayTeamInfo.name} className="w-8 h-8 object-contain" />
            <span className="text-sm font-semibold text-[#e0e7ef]">{awayTeamInfo.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#e0e7ef]">{homeTeamInfo.name}</span>
            <img src={homeTeamInfo.logo} alt={homeTeamInfo.name} className="w-8 h-8 object-contain" />
          </div>
        </div>

        {/* Win Probability Bar */}
        <div className="relative h-12 bg-[#23263a] rounded-lg overflow-hidden mb-2">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#00ffe7]/60 to-[#00ffe7]/40 transition-all duration-300"
            style={{ width: `${awayWinPct}%` }}
          />
          <div
            className="absolute right-0 top-0 h-full bg-gradient-to-l from-[#faafe8]/60 to-[#faafe8]/40 transition-all duration-300"
            style={{ width: `${homeWinPct}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-4">
            <span className="text-lg font-bold text-white z-10">{awayWinPct}%</span>
            <span className="text-xs text-gray-300 font-semibold">
              {cursorData ? (
                <span className="text-[#00ffe7]">
                  {new Date(cursorData.lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : (
                'WIN PROBABILITY'
              )}
            </span>
            <span className="text-lg font-bold text-white z-10">{homeWinPct}%</span>
          </div>
        </div>

        {/* Tie Probability */}
        {parseFloat(tiePct) > 0 && (
          <div className="text-center">
            <span className="text-xs text-gray-400">Tie Probability: </span>
            <span className="text-sm font-bold text-gray-300">{tiePct}%</span>
          </div>
        )}
      </div>


      {/* Probability Trend Chart */}
      {probTrend && probTrend.length > 1 && (
        <div className="mb-6">
          <div className="text-xs text-gray-400 font-bold uppercase mb-3 text-center">Win Probability Timeline</div>
          <div className="bg-[#23263a]/50 rounded-lg p-4">
            {/* Timeline visualization - split vertical bars */}
            <div 
              className="relative h-32 flex items-stretch gap-0.5 cursor-crosshair touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {probTrend.map((prob, idx) => {
                const homeWinPct = prob.homeWinPercentage * 100;
                const awayWinPct = prob.awayWinPercentage * 100;
                
                return (
                  <div 
                    key={idx} 
                    className="flex-1 flex flex-col relative"
                  >
                    {/* Away team (top portion) - cyan */}
                    <div 
                      className="bg-gradient-to-b from-[#00ffe7]/70 to-[#00ffe7]/50 transition-all duration-200"
                      style={{ height: `${awayWinPct}%` }}
                    />
                    {/* Home team (bottom portion) - pink */}
                    <div 
                      className="bg-gradient-to-t from-[#faafe8]/70 to-[#faafe8]/50 transition-all duration-200"
                      style={{ height: `${homeWinPct}%` }}
                    />
                  </div>
                );
              })}
              
              {/* Draggable cursor bar */}
              {cursorPosition !== null && (
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none z-20"
                  style={{ 
                    left: `${cursorPosition}%`,
                    boxShadow: '0 0 8px 2px rgba(255, 255, 255, 0.6), 0 0 12px 4px rgba(0, 255, 231, 0.4)'
                  }}
                />
              )}
            </div>
            
            {/* Center reference line (50/50) */}
            <div className="relative mt-2">
              <div className="absolute left-0 right-0 top-0 h-px bg-gray-600 opacity-50" style={{ top: '50%' }}></div>
            </div>
            
            {/* Labels */}
            <div className="flex justify-between mt-3">
              <div className="text-xs text-gray-500">Game Start</div>
              <div className="text-xs text-gray-500">Current</div>
            </div>
            
            {/* Team labels */}
            <div className="flex justify-between mt-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gradient-to-br from-[#00ffe7]/70 to-[#00ffe7]/50 rounded"></div>
                <span className="text-gray-400">{awayTeamInfo.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">{homeTeamInfo.name}</span>
                <div className="w-3 h-3 bg-gradient-to-br from-[#faafe8]/70 to-[#faafe8]/50 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-[#23263a]/50 rounded-lg text-center">
          <div className="text-xs text-gray-400 mb-1">Game Updates</div>
          <div className="text-lg font-bold text-[#00ffe7]">{filteredData.length || data.count}</div>
        </div>
        <div className="p-3 bg-[#23263a]/50 rounded-lg text-center">
          <div className="text-xs text-gray-400 mb-1">Last Updated</div>
          <div className="text-xs font-semibold text-[#faafe8]">
            {new Date(latestProb.lastModified).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-4 pt-4 border-t border-[#faafe8]/20">
        <p className="text-xs text-gray-500 text-center">
          Live probabilities powered by ESPN Analytics • Sorted chronologically by game time
        </p>
      </div>
    </div>
  );
};

export default Odds;
