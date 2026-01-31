import React, { useRef, useEffect, useState, useCallback } from 'react';
import Dashboard from './Dashboard';
import GameGrid from './GameGrid';
import { useLoading } from '../../providers/LoadingContext';

interface DashboardCarouselProps {
  activeTab: 'dashboard' | 'games';
  onTabChange: (tab: 'dashboard' | 'games') => void;
}

const Carousel: React.FC<DashboardCarouselProps> = ({ activeTab, onTabChange }) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const { showLoading, hideLoading } = useLoading();
  const [dashboardReady, setDashboardReady] = useState(false);
  const [gamesReady, setGamesReady] = useState(false);

  // Update carousel position when tab changes
  useEffect(() => {
    if (carouselRef.current) {
      const index = activeTab === 'dashboard' ? 0 : 1;
      const slidePercentage = 50; // 2 slides total
      carouselRef.current.style.transform = `translateX(-${index * slidePercentage}%)`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  useEffect(() => {
    showLoading('Loading...');
  }, [showLoading]);

  useEffect(() => {
    if (dashboardReady && gamesReady) {
      hideLoading();
    }
  }, [dashboardReady, gamesReady, hideLoading]);

  const handleDashboardReady = useCallback(() => {
    setDashboardReady(true);
  }, []);

  const handleGamesReady = useCallback(() => {
    setGamesReady(true);
  }, []);

  return (
    <div className="h-[calc(100dvh-72px)] overflow-hidden">
      <div
        ref={carouselRef}
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ width: '200%' }}
      >
        {/* Dashboard Section */}
        <div className="w-full flex-shrink-0 h-full overflow-y-auto hide-scrollbar" style={{ width: '50%' }}>
          <Dashboard onInitialReady={handleDashboardReady} onTabChange={onTabChange} />
        </div>

        {/* Games List Section - Preload games data */}
        <div className="w-full flex-shrink-0 h-full overflow-y-auto hide-scrollbar" style={{ width: '50%' }}>
          <GameGrid preload={true} onInitialReady={handleGamesReady} />
        </div>
      </div>
    </div>
  );
};

export default Carousel;
