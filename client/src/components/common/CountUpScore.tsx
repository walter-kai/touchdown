import React from 'react';
import { useCountUp } from '@/hooks/useCountUp';

interface CountUpScoreProps {
  value: number;
  className?: string;
  duration?: number;
}

export const CountUpScore: React.FC<CountUpScoreProps> = ({
  value,
  className = '',
  duration = 1000,
}) => {
  const displayValue = useCountUp(value, { duration, preserveValue: true });

  return <span className={`inline-block tabular-nums ${className}`}>{displayValue}</span>;
};
