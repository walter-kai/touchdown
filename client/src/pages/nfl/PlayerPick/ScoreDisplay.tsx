import React from 'react';

interface ScoreDisplayProps {
  score: number;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  showStats?: boolean;
  index?: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  label = 'PTS',
  size = 'medium',
  color = 'text-[#00ffe7]',
  showStats = true,
  index = 0,
}) => {
  const textSizes = {
    small: 'text-[10px]',
    medium: 'text-2xl',
    large: 'text-3xl',
  };

  const labelSizes = {
    small: 'text-[9px]',
    medium: 'text-[10px]',
    large: 'text-xs',
  };

  const textSize = textSizes[size];
  const labelSize = labelSizes[size];

  return (
    <div 
      className={`text-center transition-all duration-700 ${
        showStats ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
      }`}
      style={{ 
        transitionDelay: `${index * 100}ms`,
        transformOrigin: 'center'
      }}
    >
      <div className={`${textSize} font-bold ${color}`}>{score}</div>
      <div className={`text-[#b0b7bf] ${labelSize}`}>{label}</div>
    </div>
  );
};

export default ScoreDisplay;
