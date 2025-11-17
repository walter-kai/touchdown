import React, { useState, useEffect } from 'react';
import { FaHourglass, FaClock } from 'react-icons/fa';
import LoadingScreenDots from '../common/LoadingScreenDots';

interface LoadingStateMessageProps {
  isLoading: boolean;
  delayBeforeExtendedMessage?: number; // in milliseconds
}

const LoadingStateMessage: React.FC<LoadingStateMessageProps> = ({ 
  isLoading,
  delayBeforeExtendedMessage = 5000 // Default 5 seconds
}) => {
  const [showExtendedMessage, setShowExtendedMessage] = useState(false);
  const [fadeState, setFadeState] = useState<'fade-in' | 'fade-out' | 'hidden'>('fade-in');
  
  // Reset states when loading state changes
  useEffect(() => {
    if (isLoading) {
      setShowExtendedMessage(false);
      setFadeState('fade-in');
      
      // Set a timer to show "Taking longer than expected" message
      const timer = setTimeout(() => {
        // Start fade out
        setFadeState('fade-out');
        
        // After fade out completes, switch messages and fade in
        setTimeout(() => {
          setShowExtendedMessage(true);
          setFadeState('fade-in');
        }, 300); // matches the transition duration
        
      }, delayBeforeExtendedMessage);
      
      return () => clearTimeout(timer);
    } else {
      setFadeState('hidden');
    }
  }, [isLoading, delayBeforeExtendedMessage]);
  
  if (!isLoading) return null;
  
  return (
    <div className={`flex flex-col items-center justify-center p-6 transition-opacity duration-300 ${
      fadeState === 'fade-in' ? 'opacity-100' : 
      fadeState === 'fade-out' ? 'opacity-0' : 
      'hidden'
    }`}>
      {!showExtendedMessage ? (
        <div className="flex flex-col items-center">
          <LoadingScreenDots size={3} />
          <p className="text-[#e0e7ef] font-semibold mt-2 mb-1">Please wait</p>
          <p className="text-[#e0e7ef]/60 text-sm">Loading your data...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <FaClock className="text-[#ffcc00] text-2xl mb-3 animate-pulse" />
          <p className="text-[#e0e7ef] font-semibold mb-1">⏱️ Taking longer than expected...</p>
          <p className="text-[#e0e7ef]/60 text-xs mt-1">
            Please wait while we load your data.
          </p>
        </div>
      )}
    </div>
  );
};

export default LoadingStateMessage;
