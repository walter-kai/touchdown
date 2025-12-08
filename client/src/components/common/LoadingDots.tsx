import React, { useState, useEffect } from 'react';

interface LoadingScreenDotsProps {
  size?: number; // Size of the largest dot in Tailwind units (e.g., 4 = w-4 h-4)
}

const LoadingScreenDots: React.FC<LoadingScreenDotsProps> = ({ size = 4 }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 50); // 50ms delay

    return () => clearTimeout(timer);
  }, []);

  // Calculate dot sizes based on the largest size
  const largestSize = size;
  const mediumSize = Math.max(1, Math.round(size * 0.75)); // 75% of largest
  const smallSize = Math.max(1, Math.round(size * 0.5)); // 50% of largest

  // Calculate spacing proportional to size
  const spacing = Math.max(1, Math.round(size * 0.375)); // Proportional spacing

  // Generate Tailwind classes
  const largestClasses = `w-${largestSize} h-${largestSize}`;
  const mediumClasses = `w-${mediumSize} h-${mediumSize}`;
  const smallClasses = `w-${smallSize} h-${smallSize}`;
  const spacingClass = `space-x-${spacing}`;

  return (
    <div className="w-full items-center relative">
      <div className={`flex justify-center items-center ${spacingClass}`}>
        <div 
          className={`${smallClasses} bg-[#8b5cf6] rounded-full animate-bounce shadow-[0_0_6px_#8b5cf6] border border-[#8b5cf6]/30`}
          style={{ animationDelay: '0ms' }}
        ></div>
        <div 
          className={`${mediumClasses} bg-[#faafe8] rounded-full animate-bounce shadow-[0_0_8px_#faafe8] border border-[#faafe8]/30`}
          style={{ animationDelay: '150ms' }}
        ></div>
        <div 
          className={`${largestClasses} bg-[#00ffe7] rounded-full animate-bounce shadow-[0_0_10px_#00ffe7] border border-[#00ffe7]/30`}
          style={{ animationDelay: '300ms' }}
        ></div>
        <div 
          className={`${mediumClasses} bg-[#faafe8] rounded-full animate-bounce shadow-[0_0_8px_#faafe8] border border-[#faafe8]/30`}
          style={{ animationDelay: '450ms' }}
        ></div>
        <div 
          className={`${smallClasses} bg-[#8b5cf6] rounded-full animate-bounce shadow-[0_0_6px_#8b5cf6] border border-[#8b5cf6]/30`}
          style={{ animationDelay: '600ms' }}
        ></div>
      </div>
    </div>
  );
};

export default LoadingScreenDots;