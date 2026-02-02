'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FaArrowLeft, FaChartBar, FaTrophy, FaExchangeAlt, FaChartLine, FaPercentage, FaInfoCircle, FaCalendar, FaNewspaper, FaFootballBall, FaComments } from 'react-icons/fa';
import { debugLog } from '@/utils/debugLog';

interface GameNavBarProps {
  activeTab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'schedule' | 'news' | 'plays' | 'odds' | 'pick' | 'yourpicks' | 'dashboard' | 'games' | 'chat';
  onTabChange: (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'schedule' | 'news' | 'plays' | 'odds' | 'pick' | 'yourpicks' | 'dashboard' | 'games' | 'chat') => void;
  onTabClick?: (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'schedule' | 'news' | 'plays' | 'odds' | 'pick' | 'yourpicks' | 'dashboard' | 'games' | 'chat') => void;
  preset?: 'scoreboard' | 'summary' | 'team' | 'player' | 'dashboard';
  gameStatus?: 'pre' | 'in' | 'post';
  isVisible?: boolean;
}

const BottomNavbar: React.FC<GameNavBarProps> = ({ activeTab, onTabChange, onTabClick, preset = 'scoreboard', gameStatus, isVisible = true }) => {
  const router = useRouter();
  const pathname = usePathname();
  const league = pathname.startsWith('/nba') ? 'nba' : 'nfl';

  // All available navigation items
  const allNavItems = [
    { id: 'back', label: 'Back to Games', icon: <FaArrowLeft />, action: () => router.push('/') },
    { id: 'info', label: 'Info', icon: <FaInfoCircle /> },
    { id: 'team', label: 'Team Stats', icon: <FaChartBar /> },
    { id: 'headtohead', label: 'Head to Head', icon: <FaExchangeAlt /> },
    { id: 'pick', label: 'Pick', icon: <FaTrophy /> },
    { id: 'odds', label: 'Odds', icon: <FaChartLine /> },
    { id: 'prediction', label: 'Predictions', icon: <FaPercentage /> },
    { id: 'schedule', label: preset === 'player' ? 'Game Log' : 'Schedule', icon: <FaCalendar /> },
    { id: 'news', label: 'News', icon: <FaNewspaper /> },
    { id: 'dashboard', label: 'Dash', icon: <FaChartBar /> },
    { id: 'games', label: 'Games', icon: <FaFootballBall /> },
    { id: 'chat', label: 'Chat', icon: <FaComments /> },
  ];

  // Preset configurations
  const presetConfig = {
    scoreboard: ['back', 'info', 'pick', 'odds', 'headtohead', 'chat'],
    summary: ['back', 'info', 'pick', 'chat'],
    team: ['back', 'info', 'schedule', 'news'],
    player: ['back', 'info', 'schedule', 'news'],
    dashboard: ['dashboard', 'games'],
  };

  debugLog('MainNavBar - gameStatus:', gameStatus, 'preset:', preset);

  const navItems = presetConfig[preset]
    .map(id => allNavItems.find(item => item.id === id))
    .filter((item): item is NonNullable<typeof item> => item !== undefined);

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 bg-bg-dark/60 border-t border-neon-cyan/30 shadow-[0_-2px_24px_0_#00ffe7/20] backdrop-blur-md transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : 'translate-y-full'
    }`}>
      <div className="max-w-7xl mx-auto px-1">
        <div className="flex items-center justify-around py-1 gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = item.id === activeTab;
            const isBackButton = item.id === 'back';
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'back' && item.action) {
                    item.action();
                    return;
                  }
                  
                  if (onTabClick) {
                    onTabClick(item.id as any);
                  }
                  onTabChange(item.id as any);
                }}
                className={`
                  flex flex-col items-center justify-center gap-1 sm:gap-1.5 
                  px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg 
                  transition-all duration-200 min-w-0 flex-1
                  ${isBackButton
                    ? 'btn-purple'
                    : isActive 
                    ? 'bg-neon-cyan text-bg-darkest shadow-[0_0_12px_#00ffe7]' 
                    : 'text-neon-cyan hover:bg-neon-cyan/10'
                  }
                `}
              >
                <span className={`text-base sm:text-xl ${isActive && !isBackButton ? 'text-bg-darkest' : ''}`}>
                  {item.icon}
                </span>
                <span className={`text-[10px] sm:text-xs font-semibold text-center leading-tight truncate max-w-full ${isActive && !isBackButton ? 'text-bg-darkest' : ''}`}>
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

export default BottomNavbar;
