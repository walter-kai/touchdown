import React, { useRef, useEffect } from 'react';
import Dashboard from './Dashboard';
import GamesList from './games/GameGrid';

interface DashboardCarouselProps {
  activeTab: 'dashboard' | 'games';
  onTabChange: (tab: 'dashboard' | 'games') => void;
}

const DashboardCarousel: React.FC<DashboardCarouselProps> = ({ activeTab, onTabChange }) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  // Update carousel position when tab changes
  useEffect(() => {
    if (carouselRef.current) {
      const index = activeTab === 'dashboard' ? 0 : 1;
      const slidePercentage = 50; // 2 slides total
      carouselRef.current.style.transform = `translateX(-${index * slidePercentage}%)`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  return (
    <div className="h-[calc(100dvh-72px)] overflow-hidden">
      <div
        ref={carouselRef}
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ width: '200%' }}
      >
        {/* Dashboard Section */}
        <div className="w-full flex-shrink-0 h-full overflow-y-auto" style={{ width: '50%' }}>
          <Dashboard />
        </div>

        {/* Games List Section */}
        <div className="w-full flex-shrink-0 h-full overflow-y-auto" style={{ width: '50%' }}>
          <GamesList />
        </div>
      </div>
    </div>
  );
};

export default DashboardCarousel;
