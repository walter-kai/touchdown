import React, { useState, useEffect } from 'react';
import '../../styles/football.css';

interface LoadingFootballProps {
  message?: string;
}

const LoadingFootball: React.FC<LoadingFootballProps> = ({ message = 'Loading...' }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 50); // 50ms delay

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-bg-dark transition-opacity opacity-0 duration-500"
        style={{ opacity: visible ? 1 : 0 }}
      />
      <div className="relative w-64 h-64 mb-8 z-10">
        {/* Football spinning and flying */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/assets/football_spin.gif"
            alt="Loading"
            className="w-32 h-32 object-contain animate-football-throw"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(0, 255, 231, 0.3))',
            }}
          />
        </div>
        
        {/* Trail effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-32 h-32 animate-football-trail opacity-20">
            <img
              src="/assets/football_spin.gif"
              alt=""
              className="w-full h-full object-contain"
              style={{ filter: 'blur(8px)' }}
            />
          </div>
        </div>
      </div>

      {/* Loading text */}
      <div className="text-center space-y-4 z-10">
        <h2 className="text-2xl font-bold text-neon-cyan animate-pulse">
          {message}
        </h2>
        <div className="flex justify-center items-center space-x-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-neon-pink rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingFootball;