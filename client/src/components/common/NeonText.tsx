import React from 'react';

interface NeonTextProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  intensity?: 'low' | 'medium' | 'high';
}

const NeonText: React.FC<NeonTextProps> = ({ 
  children, 
  className = "", 
  color = "#00ffe7",
  intensity = 'medium'
}) => {
  const intensityMap = {
    low: { glow: 4, shadow: 2 },
    medium: { glow: 8, shadow: 4 },
    high: { glow: 12, shadow: 6 }
  };

  const config = intensityMap[intensity];

  return (
    <span 
      className={`transition-all duration-300 ease-in-out ${className}`}
      style={{
        color: color,
        textShadow: `5px 0 ${config.glow}px ${color}`,
        filter: `drop-shadow(0 0 ${config.shadow}px ${color})`,
      }}
    >
      {children}
    </span>
  );
};

export default NeonText;
