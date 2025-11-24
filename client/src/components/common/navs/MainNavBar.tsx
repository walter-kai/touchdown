import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaChartBar, FaTrophy, FaExchangeAlt, FaChartLine, FaPercentage, FaInfoCircle, FaCalendar, FaNewspaper } from 'react-icons/fa';

interface GameNavBarProps {
  activeTab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'odds' | 'schedule' | 'news';
  onTabChange: (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'odds' | 'schedule' | 'news') => void;
  onTabClick?: (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'odds' | 'schedule' | 'news') => void; // Called when button is clicked
  preset?: 'scoreboard' | 'summary' | 'team'; // Determines which buttons to show
}

const GameNavBar: React.FC<GameNavBarProps> = ({ activeTab, onTabChange, onTabClick, preset = 'scoreboard' }) => {
  const navigate = useNavigate();

  // All available navigation items
  const allNavItems = [
    { id: 'back', label: 'Scoreboard', icon: <FaArrowLeft />, action: () => navigate('/nfl') },
    { id: 'info', label: 'Info', icon: <FaInfoCircle /> },
    { id: 'player', label: 'Players', icon: <FaTrophy /> },
    { id: 'team', label: 'Team Stats', icon: <FaChartBar /> },
    { id: 'headtohead', label: 'Head to Head', icon: <FaExchangeAlt /> },
    { id: 'prediction', label: 'Predictions', icon: <FaPercentage /> },
    { id: 'odds', label: 'Odds', icon: <FaChartLine /> },
    { id: 'schedule', label: 'Schedule', icon: <FaCalendar /> },
    { id: 'news', label: 'News', icon: <FaNewspaper /> },
  ];

  // Preset configurations
  const presetConfig = {
    scoreboard: ['back', 'info', 'player', 'headtohead'],
    summary: ['back', 'info', 'player', 'team', 'prediction', 'odds'],
    team: ['back', 'info', 'schedule', 'news'], // Team page shows back, info, schedule, news
  };

  // Filter nav items based on preset
  const navItems = allNavItems.filter(item => 
    presetConfig[preset].includes(item.id)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#181a23] border-t border-[#00ffe7]/30 shadow-[0_-2px_24px_0_#00ffe7/20] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-around py-2 sm:py-3 gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = item.id === activeTab;
            const isBack = item.id === 'back';
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    // Call onTabClick first (to set programmatic scroll flag), then onTabChange
                    if (onTabClick) {
                      onTabClick(item.id as any);
                    }
                    onTabChange(item.id as any);
                  }
                }}
                className={`
                  flex flex-col items-center justify-center gap-1 sm:gap-1.5 
                  px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg 
                  transition-all duration-200 min-w-0 flex-1
                  ${isBack 
                    ? 'bg-[#faafe8]/10 border border-[#faafe8]/30 text-[#faafe8] hover:bg-[#faafe8]/20' 
                    : isActive 
                      ? 'bg-[#00ffe7] text-[#1a1d2e] shadow-[0_0_12px_#00ffe7]' 
                      : 'text-[#00ffe7] hover:bg-[#00ffe7]/10'
                  }
                `}
              >
                <span className={`text-base sm:text-xl ${isActive && !isBack ? 'text-[#1a1d2e]' : ''}`}>
                  {item.icon}
                </span>
                <span className={`text-[10px] sm:text-xs font-semibold text-center leading-tight truncate max-w-full ${isActive && !isBack ? 'text-[#1a1d2e]' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default GameNavBar;
