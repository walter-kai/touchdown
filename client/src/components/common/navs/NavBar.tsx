import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaChartBar, FaTrophy, FaExchangeAlt, FaChartLine, FaPercentage, FaInfoCircle, FaCalendar, FaNewspaper, FaFootballBall } from 'react-icons/fa';

interface GameNavBarProps {
  activeTab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'schedule' | 'news' | 'plays' | 'odds' | 'pick' | 'top' | 'yourpicks' | 'dashboard' | 'games';
  onTabChange: (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'schedule' | 'news' | 'plays' | 'odds' | 'pick' | 'top' | 'yourpicks' | 'dashboard' | 'games') => void;
  onTabClick?: (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'schedule' | 'news' | 'plays' | 'odds' | 'pick' | 'top' | 'yourpicks' | 'dashboard' | 'games') => void; // Called when button is clicked
  preset?: 'scoreboard' | 'summary' | 'team' | 'player' | 'dashboard'; // Determines which buttons to show
  gameStatus?: 'pre' | 'in' | 'post'; // Game status to conditionally show tabs
}

const GameNavBar: React.FC<GameNavBarProps> = ({ activeTab, onTabChange, onTabClick, preset = 'scoreboard', gameStatus }) => {
  const navigate = useNavigate();

  // All available navigation items
  const allNavItems = [
    // { id: 'back', label: 'Scoreboard', icon: <FaArrowLeft />, action: () => navigate('/nfl') },
    { id: 'info', label: 'Info', icon: <FaInfoCircle /> },
    { id: 'player', label: 'Players', icon: <FaTrophy /> },
    { id: 'team', label: 'Team Stats', icon: <FaChartBar /> },
    { id: 'headtohead', label: 'Head to Head', icon: <FaExchangeAlt /> },
    { id: 'plays', label: 'Plays', icon: <FaFootballBall /> },
    { id: 'pick', label: 'Pick', icon: <FaTrophy /> },
    { id: 'top', label: 'Top', icon: <FaChartBar /> },
    { id: 'odds', label: 'Odds', icon: <FaChartLine /> },
    { id: 'prediction', label: 'Predictions', icon: <FaPercentage /> },
    { id: 'schedule', label: preset === 'player' ? 'Game Log' : 'Schedule', icon: <FaCalendar /> },
    { id: 'news', label: 'News', icon: <FaNewspaper /> },
    { id: 'dashboard', label: 'Dash', icon: <FaChartBar /> },
    { id: 'games', label: 'Games', icon: <FaFootballBall /> },
  ];

  // Preset configurations
  const presetConfig = {
    scoreboard: ['info', 'pick', 'top', 'odds', 'headtohead'],
    summary: ['info', 'pick', 'player', 'plays'],
    team: ['info', 'schedule', 'news'], // Team page shows back, info, schedule, news
    player: ['info', 'schedule', 'news'], // Player page shows back, overview, game log, news
    dashboard: ['dashboard', 'games'], // Dashboard/Games navigation
  };

  // For upcoming games, hide 'player' and 'plays' tabs but keep 'pick' visible
  const isUpcomingGame = gameStatus === 'pre';
  const tabsToHide = isUpcomingGame ? ['player', 'plays'] : [];
  
  console.log('MainNavBar - gameStatus:', gameStatus, 'preset:', preset, 'isUpcomingGame:', isUpcomingGame, 'tabsToHide:', tabsToHide);

  // Filter nav items based on preset and maintain the order from presetConfig
  const navItems = presetConfig[preset]
    .filter(id => !tabsToHide.includes(id))
    .map(id => allNavItems.find(item => item.id === id))
    .filter((item): item is NonNullable<typeof item> => item !== undefined);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-dark border-t border-neon-cyan/30 shadow-[0_-2px_24px_0_#00ffe7/20] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-around py-2 sm:py-3 gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = item.id === activeTab;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  // Call onTabClick first (to set programmatic scroll flag), then onTabChange
                  if (onTabClick) {
                    onTabClick(item.id as any);
                  }
                  onTabChange(item.id as any);
                }}
                className={`
                  flex flex-col items-center justify-center gap-1 sm:gap-1.5 
                  px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg 
                  transition-all duration-200 min-w-0 flex-1
                  ${isActive 
                    ? 'bg-neon-cyan text-bg-darkest shadow-[0_0_12px_#00ffe7]' 
                    : 'text-neon-cyan hover:bg-neon-cyan/10'
                  }
                `}
              >
                <span className={`text-base sm:text-xl ${isActive ? 'text-bg-darkest' : ''}`}>
                  {item.icon}
                </span>
                <span className={`text-[10px] sm:text-xs font-semibold text-center leading-tight truncate max-w-full ${isActive ? 'text-bg-darkest' : ''}`}>
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
