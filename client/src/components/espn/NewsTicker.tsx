import React, { useState, useEffect } from 'react';
import { FaNewspaper, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import type { NewsArticle } from '@/types/espn/news';

interface NewsTickerProps {
  news: NewsArticle[];
}

const NewsTicker: React.FC<NewsTickerProps> = ({ news }) => {
  const [currentNewsIndex, setCurrentNewsIndex] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // News ticker auto-scroll effect
  useEffect(() => {
    if (news.length <= 1) return;

    const ticker = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentNewsIndex((prev) => (prev + 1) % news.length);
        setIsAnimating(false);
      }, 300); // Wait for fade out before changing
    }, 5000); // Change article every 5 seconds

    return () => clearInterval(ticker);
  }, [news.length]);

  if (news.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mx-2">
        <h1>Latest News</h1>
        <span className="text-gray-400 text-sm ml-auto">
          {currentNewsIndex + 1} / {Math.min(news.length, 6)}
        </span>
      </div>
      
      <div className="mx-2 bg-bg-dark rounded-xl border border-neon-pink/30 shadow-[0_0_20px_rgba(250,175,232,0.15)] overflow-hidden h-[100px]">
        <div className="flex items-stretch h-full">
          {/* Article Image */}
          <div className={`w-[100px] flex-shrink-0 relative overflow-hidden transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            {news[currentNewsIndex].images && news[currentNewsIndex].images.length > 0 ? (
              <>
                <img
                  key={currentNewsIndex}
                  src={news[currentNewsIndex].images[0].url}
                  alt={news[currentNewsIndex].headline}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-bg-dark" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-bg-darker to-bg-dark flex items-center justify-center">
                <FaNewspaper className="text-neon-pink/30 text-5xl" />
              </div>
            )}
          </div>

          {/* Article Content */}
          <div className={`flex-1 p-1 flex flex-col justify-center min-w-0 ${isAnimating ? 'opacity-0' : 'animate-slide-in-right opacity-100'}`}>
            <h5 className="text-white text-sm font-bold line-clamp-2">
              {news[currentNewsIndex].headline}
            </h5>
            
            {news[currentNewsIndex].description && (
              <p className="text-gray-300 text-xs sm:text-xs line-clamp-3">
                {news[currentNewsIndex].description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="flex items-center gap-2 mt-2 mx-auto justify-center">
        {news.slice(0, 6).map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setIsAnimating(true);
              setTimeout(() => {
                setCurrentNewsIndex(idx);
                setIsAnimating(false);
              }, 300);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentNewsIndex 
                ? 'w-8 bg-neon-pink' 
                : 'w-1.5 bg-neon-pink/30 hover:bg-neon-pink/50'
            }`}
            aria-label={`Go to article ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default NewsTicker;
